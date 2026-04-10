import { defineRelations } from 'drizzle-orm';
import { users } from './users.js';
import { teams, teamMembers } from './teams.js';
import { orgs } from './orgs.js';
import { sessions } from './sessions.js';
import { credentials, teamCredentials, userCredentials } from './credentials.js';
import { invites } from './invites.js';

export const relations = defineRelations({ users, teams, teamMembers, orgs, sessions, credentials, teamCredentials, userCredentials, invites }, (r) => ({
  users: {
    org: r.one.orgs({
      from: r.users.org_id,
      to: r.orgs.id,
      optional: false
    }),
    memberships: r.many.teamMembers()
  },
  teams: {
    manager: r.one.users({
      from: r.teams.manager_id,
      to: r.users.id
    }),
    org: r.one.orgs({
      from: r.teams.org_id,
      to: r.orgs.id
    }),
    members: r.many.teamMembers()
  },
  teamMembers: {
    user: r.one.users({
      from: r.teamMembers.user_id,
      to: r.users.id
    }),
    team: r.one.teams({
      from: r.teamMembers.team_id,
      to: r.teams.id
    })
  },
  orgs: {
    owner: r.one.users({
      from: r.orgs.admin_id,
      to: r.users.id
    }),
    teams: r.many.teams(),
    members: r.many.users(),
    invites: r.many.invites()
  },
  sessions: {
    user: r.one.users({
      from: r.sessions.user_id,
      to: r.users.id
    })
  },
  teamCredentials: {
    team: r.one.teams({
      from: r.teamCredentials.team_id,
      to: r.teams.id
    }),
    cred: r.one.credentials({
      from: r.teamCredentials.credential_id,
      to: r.credentials.id
    })
  },
  userCredentials: {
    holder: r.one.users({
      from: r.userCredentials.user_id,
      to: r.users.id
    }),
    cred: r.one.credentials({
      from: r.userCredentials.credential_id,
      to: r.credentials.id
    }),
    verifier: r.one.users({
      from: r.userCredentials.verifier_id,
      to: r.users.id
    }),
    revoker: r.one.users({
      from: r.userCredentials.revoker_id,
      to: r.users.id
    })
  },
  invites: {
    org: r.one.orgs({
      from: r.invites.org_id,
      to: r.orgs.id
    }),
    team: r.one.teams({
      from: r.invites.team_id,
      to: r.teams.id
    }),
    giver: r.one.users({
      from: r.invites.inviter_id,
      to: r.users.id
    })
  }
}));

export * from './users.js';
export * from './teams.js';
export * from './orgs.js';
export * from './sessions.js';
export * from './credentials.js';
export * from './invites.js';