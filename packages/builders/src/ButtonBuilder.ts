import type { MessageComponent, Emoji } from '@ovenjs/types';

export enum ButtonStyle {
  Primary = 1,
  Secondary = 2,
  Success = 3,
  Danger = 4,
  Link = 5,
}

export class ButtonBuilder {
  private data: Partial<MessageComponent> = {
    type: 2, // Button component type
  };

  public setCustomId(customId: string): this {
    if (this.data.style === ButtonStyle.Link) {
      throw new Error('Link buttons cannot have a custom ID');
    }
    
    if (customId.length > 100) {
      throw new Error('Custom ID cannot exceed 100 characters');
    }
    
    this.data.custom_id = customId;
    return this;
  }

  public setLabel(label: string): this {
    if (label.length > 80) {
      throw new Error('Button label cannot exceed 80 characters');
    }
    
    this.data.label = label;
    return this;
  }

  public setStyle(style: ButtonStyle): this {
    this.data.style = style;
    
    // Clear custom_id if switching to link style
    if (style === ButtonStyle.Link && this.data.custom_id) {
      delete this.data.custom_id;
    }
    
    // Clear url if switching away from link style
    if (style !== ButtonStyle.Link && this.data.url) {
      delete this.data.url;
    }
    
    return this;
  }

  public setEmoji(emoji: string | Emoji): this {
    if (typeof emoji === 'string') {
      // Unicode emoji
      this.data.emoji = { name: emoji };
    } else {
      // Custom emoji
      this.data.emoji = emoji;
    }
    return this;
  }

  public setURL(url: string): this {
    if (this.data.style !== ButtonStyle.Link) {
      throw new Error('Only link buttons can have a URL');
    }
    
    this.data.url = url;
    return this;
  }

  public setDisabled(disabled = true): this {
    this.data.disabled = disabled;
    return this;
  }

  public toJSON(): MessageComponent {
    // Validation
    if (!this.data.style) {
      throw new Error('Button style is required');
    }

    if (this.data.style === ButtonStyle.Link) {
      if (!this.data.url) {
        throw new Error('Link buttons must have a URL');
      }
    } else {
      if (!this.data.custom_id) {
        throw new Error('Non-link buttons must have a custom ID');
      }
    }

    if (!this.data.label && !this.data.emoji) {
      throw new Error('Button must have either a label or emoji');
    }

    return { ...this.data } as MessageComponent;
  }

  public static from(button: MessageComponent): ButtonBuilder {
    const builder = new ButtonBuilder();
    builder.data = { ...button };
    return builder;
  }

  // Helper methods for common button styles
  public static primary(customId: string, label: string): ButtonBuilder {
    return new ButtonBuilder()
      .setStyle(ButtonStyle.Primary)
      .setCustomId(customId)
      .setLabel(label);
  }

  public static secondary(customId: string, label: string): ButtonBuilder {
    return new ButtonBuilder()
      .setStyle(ButtonStyle.Secondary)
      .setCustomId(customId)
      .setLabel(label);
  }

  public static success(customId: string, label: string): ButtonBuilder {
    return new ButtonBuilder()
      .setStyle(ButtonStyle.Success)
      .setCustomId(customId)
      .setLabel(label);
  }

  public static danger(customId: string, label: string): ButtonBuilder {
    return new ButtonBuilder()
      .setStyle(ButtonStyle.Danger)
      .setCustomId(customId)
      .setLabel(label);
  }

  public static link(url: string, label: string): ButtonBuilder {
    return new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setURL(url)
      .setLabel(label);
  }
}