import type { 
  CreateMessageData, 
  Embed, 
  MessageComponent, 
  AllowedMentions,
  File 
} from '@ovenjs/types';
import { EmbedBuilder } from './EmbedBuilder';

export class MessageBuilder {
  private data: Partial<CreateMessageData> = {};

  public setContent(content: string): this {
    this.data.content = content;
    return this;
  }

  public setTTS(tts: boolean): this {
    this.data.tts = tts;
    return this;
  }

  public addEmbed(embed: Embed | EmbedBuilder): this {
    if (!this.data.embeds) {
      this.data.embeds = [];
    }

    if (this.data.embeds.length >= 10) {
      throw new Error('Cannot add more than 10 embeds to a message');
    }

    const embedData = embed instanceof EmbedBuilder ? embed.toJSON() : embed;
    EmbedBuilder.validateEmbed(embedData);
    
    this.data.embeds.push(embedData);
    return this;
  }

  public addEmbeds(...embeds: (Embed | EmbedBuilder)[]): this {
    for (const embed of embeds) {
      this.addEmbed(embed);
    }
    return this;
  }

  public setEmbeds(...embeds: (Embed | EmbedBuilder)[]): this {
    this.data.embeds = [];
    return this.addEmbeds(...embeds);
  }

  public addFile(file: File): this {
    if (!this.data.files) {
      this.data.files = [];
    }

    if (this.data.files.length >= 10) {
      throw new Error('Cannot add more than 10 files to a message');
    }

    this.data.files.push(file);
    return this;
  }

  public addFiles(...files: File[]): this {
    for (const file of files) {
      this.addFile(file);
    }
    return this;
  }

  public setFiles(...files: File[]): this {
    this.data.files = [];
    return this.addFiles(...files);
  }

  public addComponent(component: MessageComponent): this {
    if (!this.data.components) {
      this.data.components = [];
    }

    if (this.data.components.length >= 5) {
      throw new Error('Cannot add more than 5 action rows to a message');
    }

    this.data.components.push(component);
    return this;
  }

  public addComponents(...components: MessageComponent[]): this {
    for (const component of components) {
      this.addComponent(component);
    }
    return this;
  }

  public setComponents(...components: MessageComponent[]): this {
    this.data.components = [];
    return this.addComponents(...components);
  }

  public setAllowedMentions(allowedMentions: AllowedMentions): this {
    this.data.allowed_mentions = allowedMentions;
    return this;
  }

  public setSuppressEmbeds(suppress = true): this {
    if (!this.data.flags) {
      this.data.flags = 0;
    }
    
    if (suppress) {
      this.data.flags |= 1 << 2; // SUPPRESS_EMBEDS flag
    } else {
      this.data.flags &= ~(1 << 2);
    }
    
    return this;
  }

  public setEphemeral(ephemeral = true): this {
    if (!this.data.flags) {
      this.data.flags = 0;
    }
    
    if (ephemeral) {
      this.data.flags |= 1 << 6; // EPHEMERAL flag
    } else {
      this.data.flags &= ~(1 << 6);
    }
    
    return this;
  }

  public toJSON(): CreateMessageData {
    const result = { ...this.data };
    
    // Validate content
    if (!result.content && (!result.embeds || result.embeds.length === 0) && (!result.files || result.files.length === 0)) {
      throw new Error('Message must have content, embeds, or files');
    }

    if (result.content && result.content.length > 2000) {
      throw new Error('Message content cannot exceed 2000 characters');
    }

    return result as CreateMessageData;
  }

  public static from(message: CreateMessageData): MessageBuilder {
    const builder = new MessageBuilder();
    builder.data = { ...message };
    return builder;
  }

  // Helper methods for common message patterns
  public static success(content: string): MessageBuilder {
    return new MessageBuilder()
      .setContent(`✅ ${content}`)
      .addEmbed(new EmbedBuilder().setColor(0x00ff00));
  }

  public static error(content: string): MessageBuilder {
    return new MessageBuilder()
      .setContent(`❌ ${content}`)
      .addEmbed(new EmbedBuilder().setColor(0xff0000));
  }

  public static warning(content: string): MessageBuilder {
    return new MessageBuilder()
      .setContent(`⚠️ ${content}`)
      .addEmbed(new EmbedBuilder().setColor(0xffaa00));
  }

  public static info(content: string): MessageBuilder {
    return new MessageBuilder()
      .setContent(`ℹ️ ${content}`)
      .addEmbed(new EmbedBuilder().setColor(0x0099ff));
  }
}