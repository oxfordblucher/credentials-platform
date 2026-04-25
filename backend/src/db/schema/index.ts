import { defineRelations } from 'drizzle-orm';
import { users } from './users.js';
import { teams, teamMembers } from './teams.js';
import { orgs } from './orgs.js';
import { sessions } from './sessions.js';
import { credentialTypes, teamCredentials, userCredentials, rejectionReasons } from './credentials.js';
import { invites } from './invites.js';
import { notifications } from './notifications.js';
import { roleEnum } from './enums.js';

export const relations = defineRelations({ users, teams, teamMembers, orgs, sessions, credentialTypes, teamCredentials, userCredentials, rejectionReasons, invites, notifications }, (r) => ({
  users: {
    org: r.one.orgs({
      from: r.users.org_id,
      to: r.orgs.id,
      optional: false
    }),
    memberships: r.many.teamMembers(),
    managedTeams: r.many.teams(),
    notifications: r.many.notifications(),
    credentials: r.many.userCredentials({
      alias: 'holder'
    }), 
    verifiedCreds: r.many.userCredentials({
      alias: 'verifier'
    }),
    revokedCreds: r.many.userCredentials({
      alias: 'revoker'
    })
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
      from: r.orgs.owner_id,
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
  credentialTypes: {
    teams: r.many.teamCredentials(),
    users: r.many.userCredentials()
  },
  teamCredentials: {
    team: r.one.teams({
      from: r.teamCredentials.team_id,
      to: r.teams.id
    }),
    cred: r.one.credentialTypes({
      from: r.teamCredentials.credential_id,
      to: r.credentialTypes.id
    })
  },
  userCredentials: {
    holder: r.one.users({
      from: r.userCredentials.user_id,
      to: r.users.id,
      alias: "holder"
    }),
    cred: r.one.credentialTypes({
      from: r.userCredentials.credential_id,
      to: r.credentialTypes.id
    }),
    verifier: r.one.users({
      from: r.userCredentials.verifier_id,
      to: r.users.id,
      alias: "verifier"
    }),
    revoker: r.one.users({
      from: r.userCredentials.revoker_id,
      to: r.users.id,
      alias: "revoker"
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
  },
  notifications: {
    recipient: r.one.users({
      from: r.notifications.user_id,
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
export * from './notifications.js';
export { roleEnum } from './enums.js';