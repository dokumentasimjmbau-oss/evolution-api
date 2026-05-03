import {
  CreateNewsletterDto,
  FetchNewsletterMessagesDto,
  FindNewsletterMetadataDto,
  NewsletterJidDto,
  ReactNewsletterMessageDto,
} from '@api/dto/newsletter.dto';
import { InstanceDto } from '@api/dto/instance.dto';
import { WAMonitoringService } from '@api/services/monitor.service';

export class NewsletterController {
  constructor(private readonly waMonitor: WAMonitoringService) {}

  public async findNewsletterMetadata({ instanceName }: InstanceDto, query: FindNewsletterMetadataDto) {
    return await this.waMonitor.waInstances[instanceName].findNewsletterMetadata(query);
  }

  public async followNewsletter({ instanceName }: InstanceDto, data: NewsletterJidDto) {
    return await this.waMonitor.waInstances[instanceName].followNewsletter(data);
  }

  public async unfollowNewsletter({ instanceName }: InstanceDto, data: NewsletterJidDto) {
    return await this.waMonitor.waInstances[instanceName].unfollowNewsletter(data);
  }

  public async subscribeNewsletterUpdates({ instanceName }: InstanceDto, data: NewsletterJidDto) {
    return await this.waMonitor.waInstances[instanceName].subscribeNewsletterUpdates(data);
  }

  public async fetchNewsletterMessages({ instanceName }: InstanceDto, query: FetchNewsletterMessagesDto) {
    return await this.waMonitor.waInstances[instanceName].fetchNewsletterMessages(query);
  }

  public async createNewsletter({ instanceName }: InstanceDto, data: CreateNewsletterDto) {
    return await this.waMonitor.waInstances[instanceName].createNewsletter(data);
  }

  public async reactToNewsletterMessage({ instanceName }: InstanceDto, data: ReactNewsletterMessageDto) {
    return await this.waMonitor.waInstances[instanceName].reactToNewsletterMessage(data);
  }
}
