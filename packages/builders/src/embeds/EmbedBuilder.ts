/**
 * EmbedBuilder for OvenJS
 * Type-safe builder for Discord embeds
 */

import type { 
  EmbedData, 
  EmbedFieldData, 
  EmbedFooterData, 
  EmbedAuthorData, 
  EmbedImageData, 
  EmbedThumbnailData,
  ColorResolvable,
  ValidationResult,
  FluentBuilder,
  EMBED_LIMITS
} from '@ovenjs/types';

import { BuilderValidationError } from '@ovenjs/types';
import { resolveColor } from '../utils/ColorUtils.js';

export class EmbedBuilder implements FluentBuilder<EmbedData> {
  private data: EmbedData = {};

  /**
   * Set the embed title
   */
  setTitle(title: string): this {
    if (title.length > EMBED_LIMITS.TITLE) {
      throw new BuilderValidationError(
        'title',
        title,
        `Title must be ${EMBED_LIMITS.TITLE} characters or less`
      );
    }
    this.data.title = title;
    return this;
  }

  /**
   * Set the embed description
   */
  setDescription(description: string): this {
    if (description.length > EMBED_LIMITS.DESCRIPTION) {
      throw new BuilderValidationError(
        'description',
        description,
        `Description must be ${EMBED_LIMITS.DESCRIPTION} characters or less`
      );
    }
    this.data.description = description;
    return this;
  }

  /**
   * Set the embed URL
   */
  setURL(url: string): this {
    if (!this.isValidURL(url)) {
      throw new BuilderValidationError('url', url, 'URL must be a valid HTTP/HTTPS URL');
    }
    this.data.url = url;
    return this;
  }

  /**
   * Set the embed timestamp
   */
  setTimestamp(timestamp?: string | Date | number): this {
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

  /**
   * Set the embed color
   */
  setColor(color: ColorResolvable): this {
    this.data.color = resolveColor(color);
    return this;
  }

  /**
   * Set the embed footer
   */
  setFooter(footer: EmbedFooterData): this {
    if (footer.text.length > EMBED_LIMITS.FOOTER) {
      throw new BuilderValidationError(
        'footer.text',
        footer.text,
        `Footer text must be ${EMBED_LIMITS.FOOTER} characters or less`
      );
    }
    
    if (footer.iconURL && !this.isValidURL(footer.iconURL)) {
      throw new BuilderValidationError(
        'footer.iconURL',
        footer.iconURL,
        'Footer icon URL must be a valid HTTP/HTTPS URL'
      );
    }
    
    this.data.footer = footer;
    return this;
  }

  /**
   * Set the embed image
   */
  setImage(image: EmbedImageData | string): this {
    if (typeof image === 'string') {
      if (!this.isValidURL(image)) {
        throw new BuilderValidationError('image', image, 'Image URL must be a valid HTTP/HTTPS URL');
      }
      this.data.image = { url: image };
    } else {
      if (!this.isValidURL(image.url)) {
        throw new BuilderValidationError('image.url', image.url, 'Image URL must be a valid HTTP/HTTPS URL');
      }
      this.data.image = image;
    }
    return this;
  }

  /**
   * Set the embed thumbnail
   */
  setThumbnail(thumbnail: EmbedThumbnailData | string): this {
    if (typeof thumbnail === 'string') {
      if (!this.isValidURL(thumbnail)) {
        throw new BuilderValidationError('thumbnail', thumbnail, 'Thumbnail URL must be a valid HTTP/HTTPS URL');
      }
      this.data.thumbnail = { url: thumbnail };
    } else {
      if (!this.isValidURL(thumbnail.url)) {
        throw new BuilderValidationError('thumbnail.url', thumbnail.url, 'Thumbnail URL must be a valid HTTP/HTTPS URL');
      }
      this.data.thumbnail = thumbnail;
    }
    return this;
  }

  /**
   * Set the embed author
   */
  setAuthor(author: EmbedAuthorData): this {
    if (author.name.length > EMBED_LIMITS.AUTHOR) {
      throw new BuilderValidationError(
        'author.name',
        author.name,
        `Author name must be ${EMBED_LIMITS.AUTHOR} characters or less`
      );
    }
    
    if (author.url && !this.isValidURL(author.url)) {
      throw new BuilderValidationError(
        'author.url',
        author.url,
        'Author URL must be a valid HTTP/HTTPS URL'
      );
    }
    
    if (author.iconURL && !this.isValidURL(author.iconURL)) {
      throw new BuilderValidationError(
        'author.iconURL',
        author.iconURL,
        'Author icon URL must be a valid HTTP/HTTPS URL'
      );
    }
    
    this.data.author = author;
    return this;
  }

  /**
   * Add a field to the embed
   */
  addField(name: string, value: string, inline?: boolean): this {
    if (!this.data.fields) {
      this.data.fields = [];
    }
    
    if (this.data.fields.length >= EMBED_LIMITS.FIELDS) {
      throw new BuilderValidationError(
        'fields',
        this.data.fields.length,
        `Cannot add more than ${EMBED_LIMITS.FIELDS} fields`
      );
    }
    
    if (name.length > EMBED_LIMITS.FIELD_NAME) {
      throw new BuilderValidationError(
        'field.name',
        name,
        `Field name must be ${EMBED_LIMITS.FIELD_NAME} characters or less`
      );
    }
    
    if (value.length > EMBED_LIMITS.FIELD_VALUE) {
      throw new BuilderValidationError(
        'field.value',
        value,
        `Field value must be ${EMBED_LIMITS.FIELD_VALUE} characters or less`
      );
    }
    
    this.data.fields.push({ name, value, inline });
    return this;
  }

  /**
   * Add fields to the embed
   */
  addFields(...fields: EmbedFieldData[]): this {
    for (const field of fields) {
      this.addField(field.name, field.value, field.inline);
    }
    return this;
  }

  /**
   * Set fields for the embed (replaces existing fields)
   */
  setFields(fields: EmbedFieldData[]): this {
    if (fields.length > EMBED_LIMITS.FIELDS) {
      throw new BuilderValidationError(
        'fields',
        fields.length,
        `Cannot set more than ${EMBED_LIMITS.FIELDS} fields`
      );
    }
    
    this.data.fields = [];
    this.addFields(...fields);
    return this;
  }

  /**
   * Splice fields from the embed
   */
  spliceFields(index: number, deleteCount: number, ...fields: EmbedFieldData[]): this {
    if (!this.data.fields) {
      this.data.fields = [];
    }
    
    this.data.fields.splice(index, deleteCount, ...fields);
    
    if (this.data.fields.length > EMBED_LIMITS.FIELDS) {
      throw new BuilderValidationError(
        'fields',
        this.data.fields.length,
        `Cannot have more than ${EMBED_LIMITS.FIELDS} fields`
      );
    }
    
    return this;
  }

  /**
   * Validate the embed data
   */
  validate(): ValidationResult {
    const errors: string[] = [];
    
    // Calculate total character count
    let totalChars = 0;
    
    if (this.data.title) {
      totalChars += this.data.title.length;
      if (this.data.title.length > EMBED_LIMITS.TITLE) {
        errors.push(`Title must be ${EMBED_LIMITS.TITLE} characters or less`);
      }
    }
    
    if (this.data.description) {
      totalChars += this.data.description.length;
      if (this.data.description.length > EMBED_LIMITS.DESCRIPTION) {
        errors.push(`Description must be ${EMBED_LIMITS.DESCRIPTION} characters or less`);
      }
    }
    
    if (this.data.footer) {
      totalChars += this.data.footer.text.length;
      if (this.data.footer.text.length > EMBED_LIMITS.FOOTER) {
        errors.push(`Footer text must be ${EMBED_LIMITS.FOOTER} characters or less`);
      }
    }
    
    if (this.data.author) {
      totalChars += this.data.author.name.length;
      if (this.data.author.name.length > EMBED_LIMITS.AUTHOR) {
        errors.push(`Author name must be ${EMBED_LIMITS.AUTHOR} characters or less`);
      }
    }
    
    if (this.data.fields) {
      if (this.data.fields.length > EMBED_LIMITS.FIELDS) {
        errors.push(`Cannot have more than ${EMBED_LIMITS.FIELDS} fields`);
      }
      
      for (const field of this.data.fields) {
        totalChars += field.name.length + field.value.length;
        
        if (field.name.length > EMBED_LIMITS.FIELD_NAME) {
          errors.push(`Field name must be ${EMBED_LIMITS.FIELD_NAME} characters or less`);
        }
        
        if (field.value.length > EMBED_LIMITS.FIELD_VALUE) {
          errors.push(`Field value must be ${EMBED_LIMITS.FIELD_VALUE} characters or less`);
        }
      }
    }
    
    if (totalChars > EMBED_LIMITS.TOTAL) {
      errors.push(`Total embed character count must be ${EMBED_LIMITS.TOTAL} or less`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Build the embed
   */
  build(): EmbedData {
    const validation = this.validate();
    if (!validation.valid) {
      throw new BuilderValidationError(
        'embed',
        this.data,
        `Embed validation failed: ${validation.errors.join(', ')}`
      );
    }
    
    return { ...this.data };
  }

  /**
   * Clone the builder
   */
  clone(): EmbedBuilder {
    const cloned = new EmbedBuilder();
    cloned.data = JSON.parse(JSON.stringify(this.data));
    return cloned;
  }

  /**
   * Reset the builder
   */
  reset(): this {
    this.data = {};
    return this;
  }

  /**
   * Convert to JSON
   */
  toJSON(): EmbedData {
    return this.build();
  }

  /**
   * Check if URL is valid
   */
  private isValidURL(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }
}