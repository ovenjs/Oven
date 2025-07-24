import type { 
  Embed, 
  EmbedAuthor, 
  EmbedField, 
  EmbedFooter, 
  EmbedImage, 
  EmbedThumbnail 
} from '@ovenjs/types';

export class EmbedBuilder {
  private data: Partial<Embed> = {};

  public setTitle(title: string): this {
    this.data.title = title;
    return this;
  }

  public setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  public setURL(url: string): this {
    this.data.url = url;
    return this;
  }

  public setColor(color: number | string): this {
    if (typeof color === 'string') {
      // Convert hex color to number
      this.data.color = parseInt(color.replace('#', ''), 16);
    } else {
      this.data.color = color;
    }
    return this;
  }

  public setTimestamp(timestamp?: Date | number | string): this {
    if (timestamp === undefined) {
      this.data.timestamp = new Date().toISOString();
    } else if (timestamp instanceof Date) {
      this.data.timestamp = timestamp.toISOString();
    } else if (typeof timestamp === 'number') {
      this.data.timestamp = new Date(timestamp).toISOString();
    } else {
      this.data.timestamp = timestamp;
    }
    return this;
  }

  public setAuthor(author: { name: string; iconURL?: string; url?: string }): this {
    this.data.author = {
      name: author.name,
      icon_url: author.iconURL,
      url: author.url,
    };
    return this;
  }

  public setFooter(footer: { text: string; iconURL?: string }): this {
    this.data.footer = {
      text: footer.text,
      icon_url: footer.iconURL,
    };
    return this;
  }

  public setImage(url: string): this {
    this.data.image = { url };
    return this;
  }

  public setThumbnail(url: string): this {
    this.data.thumbnail = { url };
    return this;
  }

  public addField(name: string, value: string, inline = false): this {
    if (!this.data.fields) {
      this.data.fields = [];
    }

    if (this.data.fields.length >= 25) {
      throw new Error('Cannot add more than 25 fields to an embed');
    }

    this.data.fields.push({ name, value, inline });
    return this;
  }

  public addFields(...fields: { name: string; value: string; inline?: boolean }[]): this {
    for (const field of fields) {
      this.addField(field.name, field.value, field.inline);
    }
    return this;
  }

  public spliceFields(index: number, deleteCount: number, ...fields: { name: string; value: string; inline?: boolean }[]): this {
    if (!this.data.fields) {
      this.data.fields = [];
    }

    const mappedFields = fields.map(field => ({
      name: field.name,
      value: field.value,
      inline: field.inline ?? false,
    }));

    this.data.fields.splice(index, deleteCount, ...mappedFields);
    return this;
  }

  public setFields(...fields: { name: string; value: string; inline?: boolean }[]): this {
    this.data.fields = fields.map(field => ({
      name: field.name,
      value: field.value,
      inline: field.inline ?? false,
    }));
    return this;
  }

  public toJSON(): Embed {
    return { ...this.data } as Embed;
  }

  public static from(embed: Embed): EmbedBuilder {
    const builder = new EmbedBuilder();
    builder.data = { ...embed };
    return builder;
  }

  // Validation methods
  public static validateTitle(title?: string): void {
    if (title && title.length > 256) {
      throw new Error('Embed title cannot exceed 256 characters');
    }
  }

  public static validateDescription(description?: string): void {
    if (description && description.length > 4096) {
      throw new Error('Embed description cannot exceed 4096 characters');
    }
  }

  public static validateFields(fields?: EmbedField[]): void {
    if (!fields) return;

    if (fields.length > 25) {
      throw new Error('Embed cannot have more than 25 fields');
    }

    for (const field of fields) {
      if (field.name.length > 256) {
        throw new Error('Embed field name cannot exceed 256 characters');
      }
      if (field.value.length > 1024) {
        throw new Error('Embed field value cannot exceed 1024 characters');
      }
    }
  }

  public static validateFooter(footer?: EmbedFooter): void {
    if (footer && footer.text.length > 2048) {
      throw new Error('Embed footer text cannot exceed 2048 characters');
    }
  }

  public static validateAuthor(author?: EmbedAuthor): void {
    if (author && author.name.length > 256) {
      throw new Error('Embed author name cannot exceed 256 characters');
    }
  }

  public static validateEmbed(embed: Embed): void {
    this.validateTitle(embed.title);
    this.validateDescription(embed.description);
    this.validateFields(embed.fields);
    this.validateFooter(embed.footer);
    this.validateAuthor(embed.author);

    // Check total character count
    const totalLength = 
      (embed.title?.length ?? 0) +
      (embed.description?.length ?? 0) +
      (embed.footer?.text?.length ?? 0) +
      (embed.author?.name?.length ?? 0) +
      (embed.fields?.reduce((sum, field) => sum + field.name.length + field.value.length, 0) ?? 0);

    if (totalLength > 6000) {
      throw new Error('Embed total character count cannot exceed 6000 characters');
    }
  }
}