
# GuideStep

## Properties
| Name | Type | Description | Notes |
| ------------ | ------------- | ------------- | ------------- |
| **phase** | **kotlin.String** | Solver phase identifier (e.g. cross, f2l, oll, pll; method-specific) |  |
| **name** | **kotlin.String** |  |  |
| **moves** | **kotlin.collections.List&lt;kotlin.String&gt;** |  |  |
| **explanationKey** | **kotlin.String** | Key into the guide copy table (F4.1), not display text |  |
| **affectedPieces** | **kotlin.collections.List&lt;kotlin.String&gt;** | Cubie names the step moves (e.g. UF, UFR) |  |
| **stateAfter** | [**CubeState**](CubeState.md) |  |  |
| **displayText** | **kotlin.String** | Plain-language explanation shown to the learner |  |
| **highlightTargets** | **kotlin.collections.List&lt;kotlin.String&gt;** | Pieces/faces to highlight in the 3D view during this step |  |
| **animationDurationMs** | **kotlin.Int** | Suggested 3D animation duration for the step&#39;s moves |  |



