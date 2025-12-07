# Simple SIEM

A minimal SIEM-like application built with Python, FastAPI, and SQLite.

## Features

- HTTP event ingest (`POST /events/`)
- Event storage in SQLite
- Simple rule engine with YAML rules
- Alert creation
- Basic alert listing UI at `/`

## Quick start

```bash
pip install -r requirements.txt
python run_manager.py
```

## Testing Rules

Use these PowerShell one-liners to test the rules:

### 1. DNS Query Flood (`dns_queries.yaml`)
```powershell
$url = "http://localhost:8000/events/"; 1..105 | ForEach-Object { $body = @{ timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"); host = "dns-flood-host"; source = "powershell-test"; message = "DNS Query $_"; fields = @{ event_type = "dns_query" } } | ConvertTo-Json -Depth 5; Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" }
```

### 2. New Executable in System Path (`exe_in_sys.yaml`)
```powershell
$url = "http://localhost:8000/events/"; $body = @{ timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"); host = "exe-host"; source = "powershell-test"; message = "Malicious file creation"; fields = @{ event_type = "file_write"; file_path = "/bin/malicious_exe" } } | ConvertTo-Json -Depth 5; Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
```

### 3. Impossible Travel Login (`login_locations.yaml`)
```powershell
$url = "http://localhost:8000/events/"; 1..2 | ForEach-Object { $body = @{ timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"); host = "travel-host"; source = "powershell-test"; message = "Login $_"; fields = @{ event_type = "login_success"; geo_impossible_travel = $true; user = "traveling_user" } } | ConvertTo-Json -Depth 5; Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" }
```

### 4. Excessive Password Resets (`multiple_pass_reset.yaml`)
```powershell
$url = "http://localhost:8000/events/"; 1..4 | ForEach-Object { $body = @{ timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"); host = "reset-host"; source = "powershell-test"; message = "Reset Request $_"; fields = @{ event_type = "password_reset_request"; user = "forgetful_user" } } | ConvertTo-Json -Depth 5; Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" }
```

### 5. Port Scanning Activity (`port_scan.yaml`)
```powershell
$url = "http://localhost:8000/events/"; 1..55 | ForEach-Object { $body = @{ timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"); host = "scan-target"; source = "powershell-test"; message = "Connection Attempt $_"; fields = @{ event_type = "connection_attempt"; src_ip = "192.168.1.50" } } | ConvertTo-Json -Depth 5; Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" }
```

### 6. Process Creation Burst (`process_storm.yaml`)
```powershell
$url = "http://localhost:8000/events/"; 1..25 | ForEach-Object { $body = @{ timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"); host = "process-storm-host"; source = "powershell-test"; message = "Process Start $_"; fields = @{ event_type = "process_start" } } | ConvertTo-Json -Depth 5; Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" }
```

### 7. Service Restart Storm (`service_restart_storm.yaml`)
```powershell
$url = "http://localhost:8000/events/"; 1..4 | ForEach-Object { $body = @{ timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"); host = "service-host"; source = "powershell-test"; message = "Service Restart $_"; fields = @{ event_type = "service_restart"; service_name = "flaky_service" } } | ConvertTo-Json -Depth 5; Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" }
```

### 8. SMB Authentication Failures (`smb_auth_fail.yaml`)
```powershell
$url = "http://localhost:8000/events/"; 1..9 | ForEach-Object { $body = @{ timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"); host = "smb-target"; source = "powershell-test"; message = "SMB Fail $_"; fields = @{ event_type = "smb_auth_failure"; src_host = "smb-attacker-host" } } | ConvertTo-Json -Depth 5; Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" }
```

### 9. SSH Brute Force (`ssh_bruteforce.yaml`)
```powershell
$url = "http://localhost:8000/events/"; 1..11 | ForEach-Object { $body = @{ timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"); host = "ssh-server"; source = "powershell-test"; message = "SSH Fail $_"; fields = @{ event_type = "auth_failure"; src_ip = "10.0.0.1" } } | ConvertTo-Json -Depth 5; Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" }
```

### 10. Failed Sudo Attempts (`sudo_bruteforce.yaml`)
```powershell
$url = "http://localhost:8000/events/"; 1..6 | ForEach-Object { $body = @{ timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"); host = "sudo-host"; source = "powershell-test"; message = "Sudo Fail $_"; fields = @{ event_type = "sudo_failure"; user = "hacker" } } | ConvertTo-Json -Depth 5; Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" }
```

### 11. Possible Ransomware Activity (`sus_file_rename.yaml`)
```powershell
$url = "http://localhost:8000/events/"; 1..25 | ForEach-Object { $body = @{ timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"); host = "ransomware-host"; source = "powershell-test"; message = "File Rename $_"; fields = @{ event_type = "file_rename"; file_extension = ".enc" } } | ConvertTo-Json -Depth 5; Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" }
```

### 12. Suspicious Admin Login Time (`suspicious_time.yaml`)
```powershell
$url = "http://localhost:8000/events/"; $body = @{ timestamp = (Get-Date -Hour 3 -Minute 0 -Second 0).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"); host = "admin-workstation"; source = "powershell-test"; message = "Suspicious Time Login"; fields = @{ event_type = "login_success"; user_role = "admin"; timestamp_hour = 3; user = "admin_user" } } | ConvertTo-Json -Depth 5; Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
```

### 13. Unexpected Privileged Process (`unexpec_priv_escal.yaml`)
```powershell
$url = "http://localhost:8000/events/"; $body = @{ timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"); host = "user-workstation"; source = "powershell-test"; message = "Priv Escalation Attempt"; fields = @{ event_type = "process_start"; privilege_required = "high"; user_role = "non_admin"; user = "insider_threat" } } | ConvertTo-Json -Depth 5; Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
```

### 14. Application Error Storm (`error_storm.yaml`)
```powershell
$url = "http://localhost:8000/events/"; 1..6 | ForEach-Object { $body = @{ timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"); host = "error-host"; source = "powershell-test"; severity = "ERROR"; message = "App Error $_"; fields = @{ dummy = "field" } } | ConvertTo-Json -Depth 5; Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" }
```
