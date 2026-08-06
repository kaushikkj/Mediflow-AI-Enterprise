# Validation checklist

- [ ] `podman compose up -d --build` succeeds on a clean clone
- [ ] Patient, doctor and admin logins work
- [ ] Patient can book, reschedule and cancel
- [ ] Doctor can confirm and complete
- [ ] Prescription appears in patient records
- [ ] Upload and download works through MinIO
- [ ] Admin dashboard and audit logs load
- [ ] Data remains after container restart
