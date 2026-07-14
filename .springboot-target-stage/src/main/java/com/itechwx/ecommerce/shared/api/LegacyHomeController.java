package com.itechwx.ecommerce.shared.api;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

@RestController
public class LegacyHomeController {

    private static final MediaType HTML_UTF_8 =
            new MediaType("text", "html", StandardCharsets.UTF_8);

    @Operation(summary = "Serve the legacy API landing page")
    @GetMapping(value = "/", produces = MediaType.TEXT_HTML_VALUE)
    ResponseEntity<Resource> home() {
        return ResponseEntity.ok()
                .contentType(HTML_UTF_8)
                .body(new ClassPathResource("static/index.html"));
    }
}
