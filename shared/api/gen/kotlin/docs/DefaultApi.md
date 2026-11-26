# DefaultApi

All URIs are relative to *http://localhost:8080*

| Method | HTTP request | Description |
| ------------- | ------------- | ------------- |
| [**getHealth**](DefaultApi.md#getHealth) | **GET** /healthz | Liveness probe |
| [**getReadiness**](DefaultApi.md#getReadiness) | **GET** /readyz | Readiness probe |
| [**joinWaitlist**](DefaultApi.md#joinWaitlist) | **POST** /waitlist | Join the waitlist |
| [**solveCube**](DefaultApi.md#solveCube) | **POST** /solve | Solve a cube state (endpoint lands in F3.8; contract defined here) |


<a id="getHealth"></a>
# **getHealth**
> HealthResponse getHealth()

Liveness probe

### Example
```kotlin
// Import classes:
//import com.cubr.api.infrastructure.*
//import com.cubr.api.models.*

val apiInstance = DefaultApi()
try {
    val result : HealthResponse = apiInstance.getHealth()
    println(result)
} catch (e: ClientException) {
    println("4xx response calling DefaultApi#getHealth")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling DefaultApi#getHealth")
    e.printStackTrace()
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**HealthResponse**](HealthResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="getReadiness"></a>
# **getReadiness**
> HealthResponse getReadiness()

Readiness probe

### Example
```kotlin
// Import classes:
//import com.cubr.api.infrastructure.*
//import com.cubr.api.models.*

val apiInstance = DefaultApi()
try {
    val result : HealthResponse = apiInstance.getReadiness()
    println(result)
} catch (e: ClientException) {
    println("4xx response calling DefaultApi#getReadiness")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling DefaultApi#getReadiness")
    e.printStackTrace()
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**HealthResponse**](HealthResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

<a id="joinWaitlist"></a>
# **joinWaitlist**
> WaitlistResponse joinWaitlist(waitlistRequest)

Join the waitlist

Duplicate emails return the same success response as new signups (silent success) — the client cannot tell the difference. Rate limited (F0.6). 

### Example
```kotlin
// Import classes:
//import com.cubr.api.infrastructure.*
//import com.cubr.api.models.*

val apiInstance = DefaultApi()
val waitlistRequest : WaitlistRequest =  // WaitlistRequest | 
try {
    val result : WaitlistResponse = apiInstance.joinWaitlist(waitlistRequest)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling DefaultApi#joinWaitlist")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling DefaultApi#joinWaitlist")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **waitlistRequest** | [**WaitlistRequest**](WaitlistRequest.md)|  | |

### Return type

[**WaitlistResponse**](WaitlistResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

<a id="solveCube"></a>
# **solveCube**
> SolveResponse solveCube(solveRequest)

Solve a cube state (endpoint lands in F3.8; contract defined here)

### Example
```kotlin
// Import classes:
//import com.cubr.api.infrastructure.*
//import com.cubr.api.models.*

val apiInstance = DefaultApi()
val solveRequest : SolveRequest =  // SolveRequest | 
try {
    val result : SolveResponse = apiInstance.solveCube(solveRequest)
    println(result)
} catch (e: ClientException) {
    println("4xx response calling DefaultApi#solveCube")
    e.printStackTrace()
} catch (e: ServerException) {
    println("5xx response calling DefaultApi#solveCube")
    e.printStackTrace()
}
```

### Parameters
| Name | Type | Description  | Notes |
| ------------- | ------------- | ------------- | ------------- |
| **solveRequest** | [**SolveRequest**](SolveRequest.md)|  | |

### Return type

[**SolveResponse**](SolveResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

