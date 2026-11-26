// Mirrors IncidentAgent.Application/ReferenceData/IReferenceDataService.cs (CategoryDto, ServiceDto).

export interface Category {
  id: string;
  name: string;
  description: string | null;
}

export interface ApplicationService {
  id: string;
  name: string;
  description: string | null;
  ownerTeam: string | null;
}
