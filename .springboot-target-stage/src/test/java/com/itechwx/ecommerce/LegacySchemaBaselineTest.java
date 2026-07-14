package com.itechwx.ecommerce;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Connection;
import java.sql.ResultSet;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers(disabledWithoutDocker = true)
class LegacySchemaBaselineTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("ecommerce_fixture")
            .withUsername("fixture_user")
            .withPassword("fixture_password");

    @Test
    void createsVerifiedLegacySchemaOnEmptyDisposableDatabase() throws Exception {
        Flyway flyway = Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .load();

        assertThat(flyway.migrate().migrationsExecuted).isEqualTo(3);

        try (Connection connection = POSTGRES.createConnection("");
             ResultSet columns = connection.getMetaData().getColumns(null, "public", "orders", "total_discount ")) {
            assertThat(columns.next()).isTrue();
        }
        try (Connection connection = POSTGRES.createConnection("");
             ResultSet columns = connection.getMetaData().getColumns(null, "public", "Sku", "num")) {
            assertThat(columns.next()).isTrue();
        }
        try (Connection connection = POSTGRES.createConnection("");
             ResultSet columns = connection.getMetaData().getColumns(
                     null, "public", "key_tokens", "refresh_token_digest"
             )) {
            assertThat(columns.next()).isTrue();
        }
    }
}
