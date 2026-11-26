import ApplicationList from '../components/ApplicationList.jsx'
import ApplicationDetail from '../components/ApplicationDetail.jsx'
import {
  listVolunteerApplications,
  getVolunteerApplication,
  setVolunteerStatus,
  deleteVolunteerApplication,
} from '../api.js'

export function VolunteerList() {
  return <ApplicationList title="Volunteer applications" basePath="/volunteers" load={listVolunteerApplications} />
}

export function VolunteerDetail() {
  return (
    <ApplicationDetail
      noun="Volunteer application"
      basePath="/volunteers"
      get={getVolunteerApplication}
      setStatus={setVolunteerStatus}
      remove={deleteVolunteerApplication}
    />
  )
}
