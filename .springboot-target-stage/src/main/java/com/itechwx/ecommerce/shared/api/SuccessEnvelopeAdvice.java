package com.itechwx.ecommerce.shared.api;

import com.itechwx.ecommerce.shared.error.ApiErrorResponse;
import com.itechwx.ecommerce.shared.observability.RequestIdFilter;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

@RestControllerAdvice(basePackages = "com.itechwx.ecommerce")
public class SuccessEnvelopeAdvice implements ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(
            MethodParameter returnType,
            Class<? extends HttpMessageConverter<?>> converterType
    ) {
        Class<?> declaringClass = returnType.getDeclaringClass();
        Package declaringPackage = declaringClass.getPackage();
        return declaringPackage != null
                && declaringPackage.getName().startsWith("com.itechwx.ecommerce");
    }

    @Override
    public Object beforeBodyWrite(
            Object body,
            MethodParameter returnType,
            MediaType selectedContentType,
            Class<? extends HttpMessageConverter<?>> selectedConverterType,
            ServerHttpRequest request,
            ServerHttpResponse response
    ) {
        if (body instanceof SuccessEnvelope<?> || body instanceof ApiErrorResponse) {
            return body;
        }
        if (!MediaType.APPLICATION_JSON.isCompatibleWith(selectedContentType)) {
            return body;
        }
        if (!(request instanceof ServletServerHttpRequest servletRequest)
                || !(response instanceof ServletServerHttpResponse servletResponse)) {
            return body;
        }
        Object requestId = servletRequest.getServletRequest()
                .getAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE);
        return SuccessEnvelope.of(
                servletResponse.getServletResponse().getStatus(),
                body,
                requestId == null ? null : requestId.toString()
        );
    }
}
