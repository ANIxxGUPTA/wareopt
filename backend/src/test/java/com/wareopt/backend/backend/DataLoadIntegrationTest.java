package com.wareopt.backend.backend;

import com.wareopt.backend.backend.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.jdbc.Sql;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Disabled;

@SpringBootTest
@Testcontainers
@Disabled("Requires a Docker environment to run Testcontainers")
@Sql(scripts = {"file:../db/001_schema.sql", "file:../db/999_seed.sql"})
public class DataLoadIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "none");
    }

    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private ShiftRepository shiftRepository;

    @Test
    void testSeedDataLoadsAndCustomQueriesWork() {
        assertThat(workerRepository.count()).isEqualTo(20);
        assertThat(shiftRepository.count()).isEqualTo(14);

        // Test custom queries
        assertThat(workerRepository.findBySkillsContaining("forklift")).isNotEmpty();
        assertThat(shiftRepository.findByDayOfWeek(1)).isNotEmpty();
    }
}
