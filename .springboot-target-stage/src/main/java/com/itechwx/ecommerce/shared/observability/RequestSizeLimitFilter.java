package com.itechwx.ecommerce.shared.observability;

import com.itechwx.ecommerce.shared.config.EcommerceProperties;
import com.itechwx.ecommerce.shared.error.ApiErrorWriter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RequestSizeLimitFilter extends OncePerRequestFilter {

    private final long maxBodyBytes;
    private final ApiErrorWriter errorWriter;

    public RequestSizeLimitFilter(EcommerceProperties properties, ApiErrorWriter errorWriter) {
        this.maxBodyBytes = properties.request().maxBodyBytes();
        this.errorWriter = errorWriter;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (request.getContentLengthLong() > maxBodyBytes) {
            errorWriter.write(
                    request,
                    response,
                    HttpStatus.PAYLOAD_TOO_LARGE,
                    "PAYLOAD_TOO_LARGE",
                    "The request body exceeds the allowed size."
            );
            return;
        }
        filterChain.doFilter(request, response);
    }
}

