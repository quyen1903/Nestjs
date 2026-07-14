package com.itechwx.ecommerce.catalog.infrastructure;

import com.itechwx.ecommerce.catalog.application.CategoryService;
import com.itechwx.ecommerce.catalog.application.CategoryView;
import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.util.List;
import java.util.UUID;

public final class JdbcCategoryService implements CategoryService {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;
    private final Clock clock;

    public JdbcCategoryService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            Clock clock
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.transactionTemplate = transactionTemplate;
        this.clock = clock;
    }

    @Override
    public CategoryView create(String name, Integer sort, String parentId) {
        String id = UUID.randomUUID().toString();
        MapSqlParameterSource parameters = new MapSqlParameterSource()
                .addValue("id", id)
                .addValue("name", name.trim())
                .addValue("sort", sort)
                .addValue("parentId", normalize(parentId))
                .addValue("now", clock.millis());
        try {
            transactionTemplate.executeWithoutResult(status -> {
                if (parameters.getValue("parentId") != null) {
                    requireActive((String) parameters.getValue("parentId"));
                }
                jdbcTemplate.update("""
                        INSERT INTO "Category"(id, name, sort, is_active, created_at, updated_at)
                        VALUES (:id, :name, :sort, true, :now, :now)
                        """, parameters);
                if (parameters.getValue("parentId") != null) {
                    jdbcTemplate.update("""
                            INSERT INTO "CategoryClosureTable"(
                                "ancestorId", "descendantId", depth, is_active, created_at, updated_at
                            )
                            SELECT "ancestorId", :id, depth + 1, true, :now, :now
                              FROM "CategoryClosureTable"
                             WHERE "descendantId" = :parentId
                               AND is_active = true
                            """, parameters);
                    jdbcTemplate.update("""
                            INSERT INTO "CategoryClosureTable"(
                                "ancestorId", "descendantId", depth, is_active, created_at, updated_at
                            ) VALUES (:parentId, :id, 1, true, :now, :now)
                            ON CONFLICT ("ancestorId", "descendantId") DO NOTHING
                            """, parameters);
                }
                jdbcTemplate.update("""
                        INSERT INTO "CategoryClosureTable"(
                            "ancestorId", "descendantId", depth, is_active, created_at, updated_at
                        ) VALUES (:id, :id, 0, true, :now, :now)
                        """, parameters);
            });
        } catch (DataIntegrityViolationException exception) {
            throw new ApplicationException(
                    HttpStatus.CONFLICT,
                    "CATEGORY_CONFLICT",
                    "The category conflicts with existing hierarchy data."
            );
        }
        return new CategoryView(id, name.trim(), sort);
    }

    @Override
    public List<CategoryView> findAll() {
        return jdbcTemplate.query("""
                SELECT id, name, sort
                  FROM "Category"
                 WHERE is_active = true
                 ORDER BY sort NULLS LAST, name, id
                """, (resultSet, rowNumber) -> new CategoryView(
                resultSet.getString("id"),
                resultSet.getString("name"),
                (Integer) resultSet.getObject("sort")
        ));
    }

    @Override
    public CategoryView findOne(String id) {
        List<CategoryView> categories = jdbcTemplate.query("""
                SELECT id, name, sort
                  FROM "Category"
                 WHERE id = :id
                   AND is_active = true
                """, new MapSqlParameterSource("id", id), (resultSet, rowNumber) -> new CategoryView(
                resultSet.getString("id"),
                resultSet.getString("name"),
                (Integer) resultSet.getObject("sort")
        ));
        if (categories.isEmpty()) {
            throw notFound();
        }
        return categories.getFirst();
    }

    @Override
    public CategoryView update(String id, String name, Integer sort) {
        if (name == null && sort == null) {
            return findOne(id);
        }
        StringBuilder sql = new StringBuilder("UPDATE \"Category\" SET updated_at = :now");
        MapSqlParameterSource parameters = new MapSqlParameterSource()
                .addValue("id", id)
                .addValue("now", clock.millis());
        if (name != null) {
            sql.append(", name = :name");
            parameters.addValue("name", name.trim());
        }
        if (sort != null) {
            sql.append(", sort = :sort");
            parameters.addValue("sort", sort);
        }
        sql.append(" WHERE id = :id AND is_active = true");
        if (jdbcTemplate.update(sql.toString(), parameters) != 1) {
            throw notFound();
        }
        return findOne(id);
    }

    @Override
    public void remove(String id) {
        transactionTemplate.executeWithoutResult(status -> {
            requireActive(id);
            Integer products = jdbcTemplate.queryForObject("""
                    SELECT count(*) FROM "Spu"
                     WHERE "categoryId" = :id AND is_active = true
                    """, new MapSqlParameterSource("id", id), Integer.class);
            if (products != null && products > 0) {
                throw new ApplicationException(
                        HttpStatus.CONFLICT,
                        "CATEGORY_IN_USE",
                        "A category with active products cannot be removed."
                );
            }
            long now = clock.millis();
            jdbcTemplate.update("""
                    UPDATE "Category" SET is_active = false, updated_at = :now WHERE id = :id
                    """, new MapSqlParameterSource().addValue("id", id).addValue("now", now));
            jdbcTemplate.update("""
                    UPDATE "CategoryClosureTable"
                       SET is_active = false, updated_at = :now
                     WHERE "ancestorId" = :id OR "descendantId" = :id
                    """, new MapSqlParameterSource().addValue("id", id).addValue("now", now));
        });
    }

    private void requireActive(String id) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT count(*) FROM "Category" WHERE id = :id AND is_active = true
                """, new MapSqlParameterSource("id", id), Integer.class);
        if (count == null || count != 1) {
            throw notFound();
        }
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private ApplicationException notFound() {
        return new ApplicationException(HttpStatus.NOT_FOUND, "CATEGORY_NOT_FOUND", "Category not found.");
    }
}
