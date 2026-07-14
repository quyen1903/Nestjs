package com.itechwx.ecommerce.comment.infrastructure;

import com.itechwx.ecommerce.comment.application.CommentService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;

@Configuration(proxyBeanMethods = false)
public class CommentConfiguration {

    @Bean
    CommentService commentService(
            NamedParameterJdbcTemplate jdbcTemplate,
            TransactionTemplate transactionTemplate,
            Clock authenticationClock
    ) {
        return new JdbcCommentService(jdbcTemplate, transactionTemplate, authenticationClock);
    }
}
