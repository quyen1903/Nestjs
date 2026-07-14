package com.itechwx.ecommerce.shared.security;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FoundationProbeController {

    @GetMapping("/actuator/health")
    public ProbeHealth health() {
        return new ProbeHealth("UP");
    }

    @GetMapping("/business-probe")
    public String protectedByDefault() {
        return "must-not-run";
    }

    public record ProbeHealth(String status) {
    }
}

