# cubr backend — one static binary in a distroless image.
FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/cubr-api ./cmd/api

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/cubr-api /cubr-api
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/cubr-api"]
