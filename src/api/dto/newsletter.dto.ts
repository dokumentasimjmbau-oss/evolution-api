export class FindNewsletterMetadataDto {
  newsletterJid?: string;
  inviteCode?: string;
}

export class NewsletterJidDto {
  newsletterJid: string;
}

export class FetchNewsletterMessagesDto {
  newsletterJid: string;
  count?: number;
  since?: number;
  after?: string;
}

export class CreateNewsletterDto {
  name: string;
  description?: string;
  picture?: string;
}

export class ReactNewsletterMessageDto {
  newsletterJid: string;
  serverId: string;
  reaction: string;
}
