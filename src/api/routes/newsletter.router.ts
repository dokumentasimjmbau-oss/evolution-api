import { RouterBroker } from '@api/abstract/abstract.router';
import {
  CreateNewsletterDto,
  FetchNewsletterMessagesDto,
  FindNewsletterMetadataDto,
  NewsletterJidDto,
  ReactNewsletterMessageDto,
} from '@api/dto/newsletter.dto';
import { InstanceDto } from '@api/dto/instance.dto';
import { newsletterController } from '@api/server.module';
import {
  createNewsletterSchema,
  fetchNewsletterMessagesSchema,
  findNewsletterMetadataSchema,
  newsletterJidSchema,
  reactNewsletterMessageSchema,
} from '@validate/validate.schema';
import { RequestHandler, Router } from 'express';

import { HttpStatus } from './index.router';

export class NewsletterRouter extends RouterBroker {
  constructor(...guards: RequestHandler[]) {
    super();
    this.router
      .get(this.routerPath('findNewsletterMetadata'), ...guards, async (req, res) => {
        const instance = req.params as unknown as InstanceDto;
        const query = req.query as unknown as FindNewsletterMetadataDto;
        const response = await newsletterController.findNewsletterMetadata(instance, query);
        res.status(HttpStatus.OK).json(response);
      })
      .post(this.routerPath('followNewsletter'), ...guards, async (req, res) => {
        const response = await this.dataValidate<NewsletterJidDto>({
          request: req,
          schema: newsletterJidSchema,
          ClassRef: NewsletterJidDto,
          execute: (instance, data) => newsletterController.followNewsletter(instance, data),
        });

        res.status(HttpStatus.OK).json(response);
      })
      .post(this.routerPath('unfollowNewsletter'), ...guards, async (req, res) => {
        const response = await this.dataValidate<NewsletterJidDto>({
          request: req,
          schema: newsletterJidSchema,
          ClassRef: NewsletterJidDto,
          execute: (instance, data) => newsletterController.unfollowNewsletter(instance, data),
        });

        res.status(HttpStatus.OK).json(response);
      })
      .post(this.routerPath('subscribeNewsletterUpdates'), ...guards, async (req, res) => {
        const response = await this.dataValidate<NewsletterJidDto>({
          request: req,
          schema: newsletterJidSchema,
          ClassRef: NewsletterJidDto,
          execute: (instance, data) => newsletterController.subscribeNewsletterUpdates(instance, data),
        });

        res.status(HttpStatus.OK).json(response);
      })
      .get(this.routerPath('fetchNewsletterMessages'), ...guards, async (req, res) => {
        const instance = req.params as unknown as InstanceDto;
        const query = req.query as unknown as FetchNewsletterMessagesDto;
        // Convert count to number if present
        if (query.count) query.count = Number(query.count) as any;
        if (query.since) query.since = Number(query.since) as any;
        const response = await newsletterController.fetchNewsletterMessages(instance, query);
        res.status(HttpStatus.OK).json(response);
      })
      .post(this.routerPath('createNewsletter'), ...guards, async (req, res) => {
        const response = await this.dataValidate<CreateNewsletterDto>({
          request: req,
          schema: createNewsletterSchema,
          ClassRef: CreateNewsletterDto,
          execute: (instance, data) => newsletterController.createNewsletter(instance, data),
        });

        res.status(HttpStatus.CREATED).json(response);
      })
      .post(this.routerPath('reactToNewsletterMessage'), ...guards, async (req, res) => {
        const response = await this.dataValidate<ReactNewsletterMessageDto>({
          request: req,
          schema: reactNewsletterMessageSchema,
          ClassRef: ReactNewsletterMessageDto,
          execute: (instance, data) => newsletterController.reactToNewsletterMessage(instance, data),
        });

        res.status(HttpStatus.OK).json(response);
      });
  }

  public readonly router: Router = Router();
}
