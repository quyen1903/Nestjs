package com.itechwx.ecommerce.shared.security;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;

@FunctionalInterface
public interface SecurityFilterContributor {

    void configure(HttpSecurity http) throws Exception;
}
