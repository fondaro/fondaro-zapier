import zapier, { defineApp } from 'zapier-platform-core';

import packageJson from '../package.json' with { type: 'json' };

import authentication from './authentication.js';
import { includeBearerToken } from './lib/api.js';
import newLead from './triggers/new_lead.js';
import leadStatusChanged from './triggers/lead_status_changed.js';
import leadAssigned from './triggers/lead_assigned.js';
import leadTagged from './triggers/lead_tagged.js';
import leadUntagged from './triggers/lead_untagged.js';
import newDeal from './triggers/new_deal.js';
import dealStageChanged from './triggers/deal_stage_changed.js';
import dealWon from './triggers/deal_won.js';
import dealLost from './triggers/deal_lost.js';
import newTask from './triggers/new_task.js';
import taskCompleted from './triggers/task_completed.js';
import newNote from './triggers/new_note.js';
import callLogged from './triggers/call_logged.js';
import callAnalyzed from './triggers/call_analyzed.js';
import createLead from './creates/create_lead.js';
import updateLeadContact from './creates/update_lead_contact.js';
import updateLeadStatus from './creates/update_lead_status.js';
import addLeadAssignees from './creates/add_lead_assignees.js';
import addLeadTags from './creates/add_lead_tags.js';
import createDeal from './creates/create_deal.js';
import changeDealStage from './creates/change_deal_stage.js';
import closeDealWon from './creates/close_deal_won.js';
import closeDealLost from './creates/close_deal_lost.js';
import createTask from './creates/create_task.js';
import createNote from './creates/create_note.js';
import findLeadSearch from './searches/find_lead.js';
import findLeadById from './searches/find_lead_by_id.js';
import searchLeads from './searches/search_leads.js';
import findLeads from './searches/find_leads.js';
import findLeadActivities from './searches/find_lead_activities.js';
import findLeadCalls from './searches/find_lead_calls.js';
import semanticSearchLeads from './searches/semantic_search_leads.js';
import matchLeadsToListing from './searches/match_leads_to_listing.js';
import findLeadTags from './searches/find_lead_tags.js';
import findDeal from './searches/find_deal.js';
import findLeadDeals from './searches/find_lead_deals.js';
import findTeamMember from './searches/find_team_member.js';
import findViewing from './searches/find_viewing.js';
import findViewings from './searches/find_viewings.js';
import findOrCreateLead from './search-or-creates/find_or_create_lead.js';

export default defineApp({
  version: packageJson.version,
  platformVersion: zapier.version,

  authentication,
  // Every module maps only the fields a customer filled; raw input keeps that
  // predictable (check D028).
  flags: { cleanInputData: false },
  beforeRequest: [includeBearerToken],
  afterResponse: [],

  // 02-parity-matrix.md §1: 14 instant triggers.
  triggers: {
    [newLead.key]: newLead,
    [leadStatusChanged.key]: leadStatusChanged,
    [leadAssigned.key]: leadAssigned,
    [leadTagged.key]: leadTagged,
    [leadUntagged.key]: leadUntagged,
    [newDeal.key]: newDeal,
    [dealStageChanged.key]: dealStageChanged,
    [dealWon.key]: dealWon,
    [dealLost.key]: dealLost,
    [newTask.key]: newTask,
    [taskCompleted.key]: taskCompleted,
    [newNote.key]: newNote,
    [callLogged.key]: callLogged,
    [callAnalyzed.key]: callAnalyzed,
  },
  // §2: 11 actions.
  creates: {
    [createLead.key]: createLead,
    [updateLeadContact.key]: updateLeadContact,
    [updateLeadStatus.key]: updateLeadStatus,
    [addLeadAssignees.key]: addLeadAssignees,
    [addLeadTags.key]: addLeadTags,
    [createDeal.key]: createDeal,
    [changeDealStage.key]: changeDealStage,
    [closeDealWon.key]: closeDealWon,
    [closeDealLost.key]: closeDealLost,
    [createTask.key]: createTask,
    [createNote.key]: createNote,
  },
  // §3: 14 searches.
  searches: {
    [findLeadSearch.key]: findLeadSearch,
    [findLeadById.key]: findLeadById,
    [searchLeads.key]: searchLeads,
    [findLeads.key]: findLeads,
    [findLeadActivities.key]: findLeadActivities,
    [findLeadCalls.key]: findLeadCalls,
    [semanticSearchLeads.key]: semanticSearchLeads,
    [matchLeadsToListing.key]: matchLeadsToListing,
    [findLeadTags.key]: findLeadTags,
    [findDeal.key]: findDeal,
    [findLeadDeals.key]: findLeadDeals,
    [findTeamMember.key]: findTeamMember,
    [findViewing.key]: findViewing,
    [findViewings.key]: findViewings,
  },
  searchOrCreates: {
    [findOrCreateLead.key]: findOrCreateLead,
  },
});
