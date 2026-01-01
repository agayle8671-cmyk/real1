$token = gcloud auth print-access-token
$headers = @{ "Authorization" = "Bearer $token" }
try {
    $response = Invoke-RestMethod -Uri "https://us-central1-aiplatform.googleapis.com/v1/publishers/google/models" -Headers $headers
    $response.models | Where-Object { $_.name -like "*gemini*" } | ForEach-Object {
        Write-Output $_.name
    }
} catch {
    Write-Error $_.Exception.Message
}
