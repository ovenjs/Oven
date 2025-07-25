/**
 * ButtonBuilder for OvenJS
 * Type-safe builder for Discord buttons
 */

import type { 
  ButtonData, 
  EmojiResolvable,
  EmojiData,
  ValidationResult,
  FluentBuilder
} from '@ovenjs/types';

import { BuilderValidationError, ButtonStyle, ComponentType, COMPONENT_LIMITS } from '@ovenjs/types';

export class ButtonBuilder implements FluentBuilder<ButtonData> {
  private data: ButtonData = {
    type: ComponentType.Button,
    style: ButtonStyle.Primary,
  };

  /**
   * Set the button style
   */
  setStyle(style: ButtonStyle): this {
    this.data.style = style;
    return this;
  }

  /**
   * Set the button label
   */
  setLabel(label: string): this {
    if (label.length > COMPONENT_LIMITS.BUTTON_LABEL) {
      throw new BuilderValidationError(
        'label',
        label,
        `Button label must be ${COMPONENT_LIMITS.BUTTON_LABEL} characters or less`
      );
    }
    this.data.label = label;
    return this;
  }

  /**
   * Set the button custom ID
   */
  setCustomId(customId: string): this {
    if (this.data.style === ButtonStyle.Link) {
      throw new BuilderValidationError(
        'customId',
        customId,
        'Link buttons cannot have custom IDs'
      );
    }
    this.data.customId = customId;
    return this;
  }

  /**
   * Set the button URL (for link buttons)
   */
  setURL(url: string): this {
    if (this.data.style !== ButtonStyle.Link) {
      throw new BuilderValidationError(
        'url',
        url,
        'Only link buttons can have URLs'
      );
    }
    
    if (!this.isValidURL(url)) {
      throw new BuilderValidationError(
        'url',
        url,
        'URL must be a valid HTTP/HTTPS URL'
      );
    }
    
    this.data.url = url;
    return this;
  }

  /**
   * Set the button emoji
   */
  setEmoji(emoji: EmojiResolvable): this {
    this.data.emoji = this.resolveEmoji(emoji);
    return this;
  }

  /**
   * Set the button as disabled
   */
  setDisabled(disabled: boolean = true): this {
    this.data.disabled = disabled;
    return this;
  }

  /**
   * Validate the button data
   */
  validate(): ValidationResult {
    const errors: string[] = [];
    
    // Validate style
    if (!Object.values(ButtonStyle).includes(this.data.style)) {
      errors.push('Invalid button style');
    }
    
    // Validate label
    if (this.data.label && this.data.label.length > COMPONENT_LIMITS.BUTTON_LABEL) {
      errors.push(`Button label must be ${COMPONENT_LIMITS.BUTTON_LABEL} characters or less`);
    }
    
    // Validate that button has either label or emoji
    if (!this.data.label && !this.data.emoji) {
      errors.push('Button must have either a label or emoji');
    }
    
    // Validate custom ID or URL based on style
    if (this.data.style === ButtonStyle.Link) {
      if (!this.data.url) {
        errors.push('Link buttons must have a URL');
      }
      if (this.data.customId) {
        errors.push('Link buttons cannot have custom IDs');
      }
    } else {
      if (!this.data.customId) {
        errors.push('Non-link buttons must have a custom ID');
      }
      if (this.data.url) {
        errors.push('Non-link buttons cannot have URLs');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Build the button
   */
  build(): ButtonData {
    const validation = this.validate();
    if (!validation.valid) {
      throw new BuilderValidationError(
        'button',
        this.data,
        `Button validation failed: ${validation.errors.join(', ')}`
      );
    }
    
    return { ...this.data };
  }

  /**
   * Clone the builder
   */
  clone(): this {
    const cloned = new ButtonBuilder();
    cloned.data = JSON.parse(JSON.stringify(this.data));
    return cloned as this;
  }

  /**
   * Reset the builder
   */
  reset(): this {
    this.data = {
      type: ComponentType.Button,
      style: ButtonStyle.Primary,
    };
    return this;
  }

  /**
   * Convert to JSON
   */
  toJSON(): ButtonData {
    return this.build();
  }

  /**
   * Resolve emoji from various formats
   */
  private resolveEmoji(emoji: EmojiResolvable): EmojiData {
    if (typeof emoji === 'string') {
      // Unicode emoji
      if (this.isUnicodeEmoji(emoji)) {
        return { name: emoji };
      }
      
      // Custom emoji format <:name:id> or <a:name:id>
      const match = emoji.match(/^<(a?):([^:]+):(\d+)>$/);
      if (match) {
        return {
          id: match[3] as any,
          name: match[2],
          animated: match[1] === 'a',
        };
      }
      
      // Just the name
      return { name: emoji };
    }
    
    return emoji;
  }

  /**
   * Check if string is a unicode emoji
   */
  private isUnicodeEmoji(str: string): boolean {
    // Basic unicode emoji regex
    const emojiRegex = /^(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])+$/;
    return emojiRegex.test(str);
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