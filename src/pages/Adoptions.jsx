import ApplicationList from '../components/ApplicationList.jsx'
import ApplicationDetail from '../components/ApplicationDetail.jsx'
import {
  listAdoptionApplications,
  getAdoptionApplication,
  setAdoptionStatus,
  deleteAdoptionApplication,
} from '../api.js'

export function AdoptionList() {
  return (
    <ApplicationList title="Adoption applications" basePath="/adoptions" load={listAdoptionApplications} showAnimal />
  )
}

export function AdoptionDetail() {
  return (
    <ApplicationDetail
      noun="Adoption application"
      basePath="/adoptions"
      get={getAdoptionApplication}
      setStatus={setAdoptionStatus}
      remove={deleteAdoptionApplication}
      showAnimal
    />
  )
}
