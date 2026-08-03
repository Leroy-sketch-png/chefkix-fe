$ErrorActionPreference = 'Stop'

$cases = @(
  @{
    Name = 'valid-food-image'
    Url = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=160&q=60'
    ExpectedSuccess = $true
  },
  @{
    Name = 'known-broken-breakfast'
    Url = 'https://images.unsplash.com/photo-1482049016530-d79f7d5e8c6e?w=160'
    ExpectedSuccess = $false
  },
  @{
    Name = 'known-broken-noodles'
    Url = 'https://images.unsplash.com/photo-1596097635121-14b63a7a7e7b?w=160'
    ExpectedSuccess = $false
  }
)

$results = foreach ($case in $cases) {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $case.Url -TimeoutSec 20
    $status = [int]$response.StatusCode
    $contentType = [string]$response.Headers['Content-Type']
    $bytes = [int]$response.RawContentLength
  } catch {
    $status = [int]$_.Exception.Response.StatusCode.value__
    $contentType = ''
    $bytes = 0
  }

  $success = $status -ge 200 -and $status -lt 300
  if ($success -ne $case.ExpectedSuccess) {
    throw "$($case.Name) returned unexpected status $status"
  }
  if ($case.ExpectedSuccess -and ($contentType -notlike 'image/*' -or $bytes -le 0)) {
    throw "$($case.Name) did not return non-empty image content"
  }

  [pscustomobject]@{
    name = $case.Name
    status = $status
    contentType = $contentType
    bytes = $bytes
  }
}

$results | ConvertTo-Json
