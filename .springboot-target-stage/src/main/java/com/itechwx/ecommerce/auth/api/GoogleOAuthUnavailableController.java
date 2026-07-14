package com.itechwx.ecommerce.auth.api;

import com.itechwx.ecommerce.shared.error.ApplicationException;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth/auth/google")
@ConditionalOnProperty(
        name = "ecommerce.google-oauth.enabled",
        havingValue = "false",
        matchIfMissing = true
)
public class GoogleOAuthUnavailableController {

    @GetMapping({"", "/callback"})
    void unavailable() {
        throw new ApplicationException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "OAUTH_NOT_CONFIGURED",
                "Google sign-in is not configured."
        );
    }
}
