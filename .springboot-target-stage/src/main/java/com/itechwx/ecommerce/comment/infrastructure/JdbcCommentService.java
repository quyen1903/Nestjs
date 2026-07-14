package com.itechwx.ecommerce.comment.infrastructure;

import com.itechwx.ecommerce.comment.application.CommentAuthorView;
import com.itechwx.ecommerce.comment.application.CommentService;
import com.itechwx.ecommerce.comment.application.CommentView;
import com.itechwx.ecommerce.comment.application.CreateCommentCommand;
import com.itechwx.ecommerce.comment.application.DeleteCommentResult;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Clock;
import java.util.List;
import java.util.UUID;

public final class JdbcCommentService implements CommentService {

    private static final String COMMENT_SELECT = """
            SELECT comment.id, comment.content, comment.author_id,
                   profile.name AS author_name, profile.avatar AS author_avatar,
                   comment.created_at, comment.updated_at,
                   comment.likes_count, comment.dislikes_count, comment.replies_count,
                   comment.is_edited, comment.edited_at, comment.is_pinned,
                   comment.status::text AS status,
                   %s AS depth
              FROM comments comment
              JOIN accounts author ON author.id = comment.author_id
              LEFT JOIN account_profiles profile ON profile."accountId" = author.id
            """;

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;
    private final Clock clock;

    public JdbcCommentService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            Clock clock
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.transactionTemplate = transactionTemplate;
        this.clock = clock;
    }

    @Override
    public CommentView create(String userId, CreateCommentCommand command) {
        requireProduct(command.productId());
        return transactionTemplate.execute(status -> {
            requireActiveUser(userId);
            String parentId = blankToNull(command.parentId());
            String threadId = null;
            if (parentId != null) {
                List<String> threads = jdbcTemplate.query("""
                        SELECT COALESCE(thread_id, id)
                          FROM comments
                         WHERE id = :parentId AND spu_id = :productId
                           AND is_active = true AND is_deleted = false
                         FOR UPDATE
                        """, new MapSqlParameterSource()
                        .addValue("parentId", parentId)
                        .addValue("productId", command.productId()),
                        (resultSet, rowNumber) -> resultSet.getString(1));
                if (threads.isEmpty()) {
                    throw notFound("COMMENT_PARENT_NOT_FOUND", "Parent comment not found.");
                }
                threadId = threads.getFirst();
            }

            String id = UUID.randomUUID().toString();
            jdbcTemplate.update("""
                    INSERT INTO comments(
                        id, is_deleted, is_active, created_at, updated_at,
                        author_id, author_type, content, content_type,
                        dislikes_count, is_edited, is_pinned, likes_count,
                        replies_count, spu_id, status, target_id, target_type, thread_id
                    ) VALUES (
                        :id, false, true, :now, :now,
                        :userId, CAST('USER' AS "CommentAuthorType"), :content,
                        CAST('TEXT' AS "CommentType"), 0, false, false, 0,
                        0, :productId, CAST('PUBLISHED' AS "CommentStatus"),
                        :productId, CAST('PRODUCT' AS "CommentTargetType"), :threadId
                    )
                    """, new MapSqlParameterSource()
                    .addValue("id", id)
                    .addValue("now", clock.millis())
                    .addValue("userId", userId)
                    .addValue("content", command.content().trim())
                    .addValue("productId", command.productId())
                    .addValue("threadId", parentId == null ? id : threadId));

            jdbcTemplate.update("""
                    INSERT INTO comment_closure("ancestorId", "descendantId", depth)
                    VALUES (:id, :id, 0)
                    """, new MapSqlParameterSource("id", id));
            if (parentId != null) {
                jdbcTemplate.update("""
                        INSERT INTO comment_closure("ancestorId", "descendantId", depth)
                        SELECT "ancestorId", :id, depth + 1
                          FROM comment_closure
                         WHERE "descendantId" = :parentId
                        """, new MapSqlParameterSource()
                        .addValue("id", id)
                        .addValue("parentId", parentId));
                jdbcTemplate.update("""
                        UPDATE comments
                           SET replies_count = replies_count + 1, updated_at = :now
                         WHERE id = :parentId
                        """, new MapSqlParameterSource()
                        .addValue("now", clock.millis())
                        .addValue("parentId", parentId));
            }
            return findOne(id, parentId == null ? 0 : 1);
        });
    }

    @Override
    public List<CommentView> find(String productId, String parentId) {
        requireProduct(productId);
        String normalizedParent = blankToNull(parentId);
        if (normalizedParent == null) {
            return jdbcTemplate.query(COMMENT_SELECT.formatted("0") + """
                     WHERE comment.spu_id = :productId
                       AND comment.is_active = true AND comment.is_deleted = false
                       AND NOT EXISTS (
                           SELECT 1 FROM comment_closure relation
                            WHERE relation."descendantId" = comment.id AND relation.depth > 0
                       )
                     ORDER BY comment.created_at, comment.id
                    """, new MapSqlParameterSource("productId", productId), this::mapComment);
        }
        requireParent(productId, normalizedParent);
        return jdbcTemplate.query(COMMENT_SELECT.formatted("relation.depth") + """
                  JOIN comment_closure relation
                    ON relation."descendantId" = comment.id
                   AND relation."ancestorId" = :parentId
                   AND relation.depth > 0
                 WHERE comment.spu_id = :productId
                   AND comment.is_active = true AND comment.is_deleted = false
                 ORDER BY comment.created_at, comment.id
                """, new MapSqlParameterSource()
                .addValue("parentId", normalizedParent)
                .addValue("productId", productId), this::mapComment);
    }

    @Override
    public DeleteCommentResult delete(String userId, String productId, String commentId) {
        requireProduct(productId);
        return transactionTemplate.execute(status -> {
            List<CommentOwner> owners = jdbcTemplate.query("""
                    SELECT author_id,
                           (SELECT "ancestorId" FROM comment_closure
                             WHERE "descendantId" = comment.id AND depth = 1) AS parent_id
                      FROM comments comment
                     WHERE comment.id = :commentId AND comment.spu_id = :productId
                       AND comment.is_active = true AND comment.is_deleted = false
                     FOR UPDATE
                    """, new MapSqlParameterSource()
                    .addValue("commentId", commentId)
                    .addValue("productId", productId), (resultSet, rowNumber) ->
                    new CommentOwner(resultSet.getString("author_id"), resultSet.getString("parent_id")));
            if (owners.isEmpty()) {
                throw notFound("COMMENT_NOT_FOUND", "Comment not found.");
            }
            CommentOwner owner = owners.getFirst();
            if (!owner.authorId().equals(userId)) {
                throw new ApplicationException(
                        HttpStatus.FORBIDDEN,
                        "COMMENT_OWNERSHIP_REQUIRED",
                        "Only the comment author may delete this comment."
                );
            }
            jdbcTemplate.update("""
                    UPDATE comments
                       SET is_active = false, is_deleted = true,
                           content = '[deleted]', updated_at = :now
                     WHERE id = :commentId AND author_id = :userId AND is_active = true
                    """, new MapSqlParameterSource()
                    .addValue("now", clock.millis())
                    .addValue("commentId", commentId)
                    .addValue("userId", userId));
            if (owner.parentId() != null) {
                jdbcTemplate.update("""
                        UPDATE comments
                           SET replies_count = GREATEST(replies_count - 1, 0), updated_at = :now
                         WHERE id = :parentId
                        """, new MapSqlParameterSource()
                        .addValue("now", clock.millis())
                        .addValue("parentId", owner.parentId()));
            }
            return new DeleteCommentResult(
                    commentId,
                    0,
                    "Comment soft deleted successfully"
            );
        });
    }

    private void requireProduct(String productId) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT count(*) FROM "Spu"
                 WHERE id = :productId AND is_active = true
                   AND status = 1 AND "isMarketable" = true
                """, new MapSqlParameterSource("productId", productId), Integer.class);
        if (count == null || count == 0) {
            throw notFound("PRODUCT_NOT_FOUND", "Product not found.");
        }
    }

    private void requireActiveUser(String userId) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT count(*) FROM accounts
                 WHERE id = :userId AND is_active = true
                   AND status = CAST('ACTIVE' AS "Status")
                   AND account_type = CAST('USER' AS "AccountType")
                """, new MapSqlParameterSource("userId", userId), Integer.class);
        if (count == null || count == 0) {
            throw new ApplicationException(HttpStatus.FORBIDDEN, "USER_INACTIVE", "User is inactive.");
        }
    }

    private void requireParent(String productId, String parentId) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT count(*) FROM comments
                 WHERE id = :parentId AND spu_id = :productId
                   AND is_active = true AND is_deleted = false
                """, new MapSqlParameterSource()
                .addValue("parentId", parentId)
                .addValue("productId", productId), Integer.class);
        if (count == null || count == 0) {
            throw notFound("COMMENT_PARENT_NOT_FOUND", "Parent comment not found.");
        }
    }

    private CommentView findOne(String id, int depth) {
        List<CommentView> comments = jdbcTemplate.query(
                COMMENT_SELECT.formatted(Integer.toString(depth)) + " WHERE comment.id = :id",
                new MapSqlParameterSource("id", id),
                this::mapComment
        );
        return comments.stream().findFirst().orElseThrow(() ->
                new IllegalStateException("Created comment is unavailable"));
    }

    private CommentView mapComment(ResultSet resultSet, int rowNumber) throws SQLException {
        long editedAt = resultSet.getLong("edited_at");
        Long nullableEditedAt = resultSet.wasNull() ? null : editedAt;
        return new CommentView(
                resultSet.getString("id"),
                resultSet.getString("content"),
                new CommentAuthorView(
                        resultSet.getString("author_id"),
                        resultSet.getString("author_name"),
                        resultSet.getString("author_avatar")
                ),
                resultSet.getLong("created_at"),
                resultSet.getLong("updated_at"),
                resultSet.getInt("likes_count"),
                resultSet.getInt("dislikes_count"),
                resultSet.getInt("replies_count"),
                resultSet.getBoolean("is_edited"),
                nullableEditedAt,
                resultSet.getBoolean("is_pinned"),
                resultSet.getString("status"),
                resultSet.getInt("depth")
        );
    }

    private ApplicationException notFound(String code, String message) {
        return new ApplicationException(HttpStatus.NOT_FOUND, code, message);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record CommentOwner(String authorId, String parentId) {
    }
}
