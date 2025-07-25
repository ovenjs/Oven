/**
 * ActionRowBuilder for OvenJS
 * Type-safe builder for Discord action rows
 */

import type { 
  ActionRowData, 
  ComponentData, 
  ValidationResult,
  FluentBuilder
} from '@ovenjs/types';

import { BuilderValidationError, ComponentType, COMPONENT_LIMITS } from '@ovenjs/types';

export class ActionRowBuilder implements FluentBuilder<ActionRowData> {
  private data: ActionRowData = {
    type: ComponentType.ActionRow,
    components: [],
  };

  /**
   * Add a component to the action row
   */
  addComponent(component: ComponentData): this {
    if (this.data.components.length >= COMPONENT_LIMITS.ACTION_ROW_COMPONENTS) {
      throw new BuilderValidationError(
        'components',
        this.data.components.length,
        `Action row can only have ${COMPONENT_LIMITS.ACTION_ROW_COMPONENTS} components`
      );
    }
    
    this.data.components.push(component);
    return this;
  }

  /**
   * Add multiple components to the action row
   */
  addComponents(...components: ComponentData[]): this {
    for (const component of components) {
      this.addComponent(component);
    }
    return this;
  }

  /**
   * Set components for the action row (replaces existing components)
   */
  setComponents(components: ComponentData[]): this {
    if (components.length > COMPONENT_LIMITS.ACTION_ROW_COMPONENTS) {
      throw new BuilderValidationError(
        'components',
        components.length,
        `Action row can only have ${COMPONENT_LIMITS.ACTION_ROW_COMPONENTS} components`
      );
    }
    
    this.data.components = [...components];
    return this;
  }

  /**
   * Splice components from the action row
   */
  spliceComponents(index: number, deleteCount: number, ...components: ComponentData[]): this {
    this.data.components.splice(index, deleteCount, ...components);
    
    if (this.data.components.length > COMPONENT_LIMITS.ACTION_ROW_COMPONENTS) {
      throw new BuilderValidationError(
        'components',
        this.data.components.length,
        `Action row can only have ${COMPONENT_LIMITS.ACTION_ROW_COMPONENTS} components`
      );
    }
    
    return this;
  }

  /**
   * Validate the action row data
   */
  validate(): ValidationResult {
    const errors: string[] = [];
    
    // Validate component count
    if (this.data.components.length === 0) {
      errors.push('Action row must have at least one component');
    }
    
    if (this.data.components.length > COMPONENT_LIMITS.ACTION_ROW_COMPONENTS) {
      errors.push(`Action row can only have ${COMPONENT_LIMITS.ACTION_ROW_COMPONENTS} components`);
    }
    
    // Validate that all components are not action rows
    for (const component of this.data.components) {
      if (component.type === ComponentType.ActionRow) {
        errors.push('Action rows cannot contain other action rows');
      }
    }
    
    // Validate component types compatibility
    const hasButtons = this.data.components.some(c => c.type === ComponentType.Button);
    const hasSelects = this.data.components.some(c => 
      c.type === ComponentType.SelectMenu ||
      c.type === ComponentType.UserSelect ||
      c.type === ComponentType.RoleSelect ||
      c.type === ComponentType.MentionableSelect ||
      c.type === ComponentType.ChannelSelect
    );
    
    if (hasButtons && hasSelects) {
      errors.push('Action row cannot contain both buttons and select menus');
    }
    
    if (hasSelects && this.data.components.length > 1) {
      errors.push('Action row can only contain one select menu');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Build the action row
   */
  build(): ActionRowData {
    const validation = this.validate();
    if (!validation.valid) {
      throw new BuilderValidationError(
        'actionRow',
        this.data,
        `Action row validation failed: ${validation.errors.join(', ')}`
      );
    }
    
    return { ...this.data };
  }

  /**
   * Clone the builder
   */
  clone(): ActionRowBuilder {
    const cloned = new ActionRowBuilder();
    cloned.data = JSON.parse(JSON.stringify(this.data));
    return cloned;
  }

  /**
   * Reset the builder
   */
  reset(): this {
    this.data = {
      type: ComponentType.ActionRow,
      components: [],
    };
    return this;
  }

  /**
   * Convert to JSON
   */
  toJSON(): ActionRowData {
    return this.build();
  }
}