```js
const socket = io('http://localhost:4000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});