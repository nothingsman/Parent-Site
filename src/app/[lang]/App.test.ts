import { describe, expect, it } from 'vitest';
import { getParentDisplayName } from '@/App';
import type { ParentMeResponse } from '@/types/api';

function buildParentProfile(overrides?: Partial<ParentMeResponse>): ParentMeResponse {
  return {
    id: 'parent-1',
    user: 'user-1',
    organizations: ['org-1'],
    branches: ['branch-1'],
    secondary_phone_number: '',
    occupation: '',
    work_address: '',
    relationship_notes: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    is_active: true,
    created_at: '2026-05-30T10:29:12.191063Z',
    updated_at: '2026-05-30T13:17:05.788647Z',
    organization_ids: ['org-1'],
    branch_ids: ['branch-1'],
    user_details: {
      id: 'user-1',
      name: 'Robel',
      phone_number: '+251930856496',
      email: null,
    },
    organization_details: [
      { id: 'org-1', name: 'Adis', status: 'ACTIVE' },
    ],
    branch_details: [
      {
        id: 'branch-1',
        name: 'Tulu branch',
        organization: 'org-1',
        status: 'ACTIVE',
      },
    ],
    student_details: [],
    ...overrides,
  };
}

describe('getParentDisplayName', () => {
  it('uses user_details.name when present', () => {
    expect(getParentDisplayName(buildParentProfile())).toBe('Robel');
  });

  it('falls back to user_details.phone_number when name is blank', () => {
    expect(
      getParentDisplayName(
        buildParentProfile({
          user_details: {
            id: 'user-1',
            name: '   ',
            phone_number: '+251930856496',
            email: null,
          },
        }),
      ),
    ).toBe('+251930856496');
  });

  it('falls back to Parent when both name and phone number are missing', () => {
    expect(
      getParentDisplayName(
        buildParentProfile({
          user_details: {
            id: 'user-1',
            name: '',
            phone_number: '',
            email: null,
          },
        }),
      ),
    ).toBe('Parent');
  });
});
