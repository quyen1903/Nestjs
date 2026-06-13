# QuyenCommerce Frontend

Static frontend for the Nest ecommerce backend.

## Run

Open `index.html` in a browser.

The default API base is:

```text
http://localhost:3056/v1/api
```

You can change it from the Connection panel. The app stores the API base, auth session, and cart in `localStorage`.

## Backend Endpoints Used

- `GET /product/all`
- `GET /product/search/:keySearch`
- `GET /product/productById/:productId`
- `POST /user/registerManual`
- `POST /loginManual`
- `POST /register`
- `POST /login`
- `POST /logout`
- `GET /cart`
- `POST /cart`
- `POST /cart/update`
- `POST /checkout/review`
- `POST /checkout/create_order`
- `POST /product/create_product`
- `POST /product/create_brand`
