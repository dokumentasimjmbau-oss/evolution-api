import { JSONSchema7 } from 'json-schema';

export const findNewsletterMetadataSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    newsletterJid: { type: 'string' },
    inviteCode: { type: 'string' },
  },
};

export const newsletterJidSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    newsletterJid: {
      type: 'string',
      description: 'newsletterJid harus berformat <id>@newsletter',
    },
  },
  required: ['newsletterJid'],
};

export const fetchNewsletterMessagesSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    newsletterJid: { type: 'string' },
    count: { type: 'integer', minimum: 1, maximum: 100 },
    since: { type: 'integer' },
    after: { type: 'string' },
  },
  required: ['newsletterJid'],
};

export const createNewsletterSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 255 },
    description: { type: 'string', maxLength: 512 },
    picture: { type: 'string' },
  },
  required: ['name'],
};

export const reactNewsletterMessageSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    newsletterJid: { type: 'string' },
    serverId: { type: 'string', minLength: 1 },
    reaction: { type: 'string' },
  },
  required: ['newsletterJid', 'serverId', 'reaction'],
};
