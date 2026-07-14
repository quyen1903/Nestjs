package com.itechwx.ecommerce.auth.security;

import com.itechwx.ecommerce.auth.domain.ActorPrincipal;
import com.itechwx.ecommerce.auth.domain.ActorType;
import com.itechwx.ecommerce.shared.error.ApiErrorWriter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public final class LegacyAccessTokenFilter extends OncePerRequestFilter {

    private static final Logger LOGGER = LoggerFactory.getLogger(LegacyAccessTokenFilter.class);
    private static final String BEARER_PREFIX = "Bearer ";

    private final LegacyAccessTokenAuthenticator authenticator;
    private final ApiErrorWriter errorWriter;

    public LegacyAccessTokenFilter(
            LegacyAccessTokenAuthenticator authenticator,
            ApiErrorWriter errorWriter
    ) {
        this.authenticator = authenticator;
        this.errorWriter = errorWriter;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization == null) {
            filterChain.doFilter(request, response);
            return;
        }

        if (!authorization.startsWith(BEARER_PREFIX)
                || authorization.length() == BEARER_PREFIX.length()
                || authorization.indexOf(',') >= 0) {
            errorWriter.write(request, response, HttpStatus.UNAUTHORIZED,
                    "INVALID_ACCESS_TOKEN", "The access token is invalid.");
            return;
        }

        try {
            ActorPrincipal actor = authenticator.authenticate(
                    authorization.substring(BEARER_PREFIX.length())
            );
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(actor, null, authorities(actor));
            SecurityContextHolder.getContext().setAuthentication(authentication);
            filterChain.doFilter(request, response);
        } catch (LegacyAuthenticationException exception) {
            SecurityContextHolder.clearContext();
            errorWriter.write(request, response, HttpStatus.UNAUTHORIZED,
                    "INVALID_ACCESS_TOKEN", "The access token is invalid.");
        } catch (RuntimeException exception) {
            SecurityContextHolder.clearContext();
            LOGGER.error(
                    "Authentication infrastructure failure type={} requestId={} path={}",
                    exception.getClass().getName(),
                    ApiErrorWriter.requestId(request),
                    request.getRequestURI()
            );
            errorWriter.write(request, response, HttpStatus.SERVICE_UNAVAILABLE,
                    "AUTHENTICATION_UNAVAILABLE", "Authentication is temporarily unavailable.");
        }
    }

    private List<SimpleGrantedAuthority> authorities(ActorPrincipal actor) {
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + actor.actorType().name()));
        if (actor.actorType() == ActorType.SUPER_ADMIN) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }
        actor.permissions().stream()
                .sorted()
                .map(permission -> new SimpleGrantedAuthority("PERMISSION_" + permission))
                .forEach(authorities::add);
        return List.copyOf(authorities);
    }
}
