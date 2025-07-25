/**
 * ModalBuilder for OvenJS
 * Type-safe builder for Discord modals
 */

import type { 
  ModalData, 
  ActionRowData, 
  ComponentType,
  ValidationResult,
  FluentBuilder
} from '@ovenjs/types';

import { BuilderValidationError } from '@ovenjs/types';

export class ModalBuilder implements FluentBuilder<ModalData> {
  private data: ModalData = {
    customId: '',
    title: '',
    components: [],
  };

  /**
   * Set the modal custom ID
   */
  setCustomId(customId: string): this {
    this.data.customId = customId;
    return this;
  }

  /**
   * Set the modal title
   */
  setTitle(title: string): this {
    if (title.length > 45) {
      throw new BuilderValidationError(
        'title',
        title,
        'Modal title must be 45 characters or less'
      );
    }
    this.data.title = title;
    return this;
  }

  /**
   * Add a component (action row) to the modal
   */
  addComponent(component: ActionRowData): this {
    if (this.data.components.length >= 5) {
      throw new BuilderValidationError(
        'components',
        this.data.components.length,
        'Modal can only have 5 action rows'
      );
    }
    
    this.validateComponent(component);
    this.data.components.push(component);
    return this;
  }

  /**
   * Add multiple components to the modal
   */
  addComponents(...components: ActionRowData[]): this {
    for (const component of components) {
      this.addComponent(component);
    }
    return this;
  }

  /**
   * Set components for the modal (replaces existing components)
   */
  setComponents(components: ActionRowData[]): this {
    if (components.length > 5) {
      throw new BuilderValidationError(
        'components',
        components.length,
        'Modal can only have 5 action rows'
      );
    }
    
    for (const component of components) {
      this.validateComponent(component);
    }
    
    this.data.components = [...components];
    return this;
  }

  /**
   * Validate a component
   */
  private validateComponent(component: ActionRowData): void {
    if (component.type !== ComponentType.ActionRow) {
      throw new BuilderValidationError(
        'component.type',
        component.type,
        'Modal components must be action rows'
      );
    }
    
    // Validate that action row contains only text inputs
    for (const subComponent of component.components) {
      if (subComponent.type !== ComponentType.TextInput) {
        throw new BuilderValidationError(
          'component.components',
          subComponent.type,
          'Modal action rows can only contain text inputs'
        );
      }
    }
  }

  /**
   * Validate the modal data
   */
  validate(): ValidationResult {
    const errors: string[] = [];
    
    // Validate custom ID
    if (!this.data.customId) {
      errors.push('Modal must have a custom ID');
    }
    
    // Validate title
    if (!this.data.title) {
      errors.push('Modal must have a title');
    }
    
    if (this.data.title.length > 45) {
      errors.push('Modal title must be 45 characters or less');
    }
    
    // Validate components
    if (this.data.components.length === 0) {
      errors.push('Modal must have at least one component');
    }
    
    if (this.data.components.length > 5) {
      errors.push('Modal can only have 5 action rows');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Build the modal
   */
  build(): ModalData {
    const validation = this.validate();
    if (!validation.valid) {
      throw new BuilderValidationError(
        'modal',
        this.data,
        `Modal validation failed: ${validation.errors.join(', ')}`
      );
    }
    
    return { ...this.data };
  }

  /**
   * Clone the builder
   */
  clone(): ModalBuilder {
    const cloned = new ModalBuilder();
    cloned.data = JSON.parse(JSON.stringify(this.data));
    return cloned;
  }

  /**
   * Reset the builder
   */
  reset(): this {
    this.data = {
      customId: '',
      title: '',
      components: [],
    };
    return this;
  }

  /**
   * Convert to JSON
   */
  toJSON(): ModalData {
    return this.build();
  }
}