package com.itechwx.ecommerce.comment.api;

import com.itechwx.ecommerce.auth.domain.ActorPrincipal;
import com.itechwx.ecommerce.auth.security.UserOnly;
import com.itechwx.ecommerce.comment.application.CommentService;
import com.itechwx.ecommerce.comment.application.CommentView;
import com.itechwx.ecommerce.comment.application.CreateCommentCommand;
import com.itechwx.ecommerce.comment.application.DeleteCommentResult;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@UserOnly
@Validated
@RestController
@RequestMapping("/comment")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping
    CommentView create(
            @AuthenticationPrincipal ActorPrincipal actor,
            @Valid @RequestBody CreateCommentRequest request
    ) {
        // commentUserId remains accepted for legacy request compatibility but is
        // deliberately non-authoritative. The verified principal is the author.
        return commentService.create(actor.accountId(), new CreateCommentCommand(
                request.commentProductId(),
                request.commentContent(),
                request.commentParentId()
        ));
    }

    @GetMapping
    List<CommentView> find(
            @RequestParam @NotBlank @Size(max = 128) String commentProductId,
            @RequestParam(required = false) @Size(max = 128) String commentParentId
    ) {
        return commentService.find(commentProductId, commentParentId);
    }

    @DeleteMapping
    DeleteCommentResult delete(
            @AuthenticationPrincipal ActorPrincipal actor,
            @Valid @RequestBody DeleteCommentRequest request
    ) {
        return commentService.delete(actor.accountId(), request.commentProductId(), request.id());
    }
}
