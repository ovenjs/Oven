/**
 * TextInputBuilder for OvenJS
 * Type-safe builder for Discord text inputs
 */

import type { 
  TextInputData, 
  ValidationResult,
  FluentBuilder
} from '@ovenjs/types';

import { BuilderValidationError, TextInputStyle, ComponentType, COMPONENT_LIMITS } from '@ovenjs/types';

export class TextInputBuilder implements FluentBuilder<TextInputData> {
  private data: TextInputData = {
    type: ComponentType.TextInput,
    customId: '',
    style: TextInputStyle.Short,
    label: '',
  };

  /**
   * Set the text input custom ID
   */
  setCustomId(customId: string): this {
    this.data.customId = customId;
    return this;
  }

  /**
   * Set the text input style
   */
  setStyle(style: TextInputStyle): this {
    this.data.style = style;
    return this;
  }

  /**
   * Set the text input label
   */
  setLabel(label: string): this {
    if (label.length > COMPONENT_LIMITS.TEXT_INPUT_LABEL) {
      throw new BuilderValidationError(
        'label',
        label,
        `Text input label must be ${COMPONENT_LIMITS.TEXT_INPUT_LABEL} characters or less`
      );
    }
    this.data.label = label;
    return this;
  }

  /**
   * Set the text input placeholder
   */
  setPlaceholder(placeholder: string): this {
    if (placeholder.length > COMPONENT_LIMITS.TEXT_INPUT_PLACEHOLDER) {
      throw new BuilderValidationError(
        'placeholder',
        placeholder,
        `Text input placeholder must be ${COMPONENT_LIMITS.TEXT_INPUT_PLACEHOLDER} characters or less`
      );
    }
    this.data.placeholder = placeholder;
    return this;
  }

  /**
   * Set the text input value
   */
  setValue(value: string): this {
    if (value.length > COMPONENT_LIMITS.TEXT_INPUT_VALUE) {
      throw new BuilderValidationError(
        'value',
        value,
        `Text input value must be ${COMPONENT_LIMITS.TEXT_INPUT_VALUE} characters or less`
      );
    }
    this.data.value = value;
    return this;
  }

  /**
   * Set the minimum length
   */
  setMinLength(minLength: number): this {
    if (minLength < 0) {
      throw new BuilderValidationError(
        'minLength',
        minLength,
        'Minimum length must be non-negative'
      );
    }
    this.data.minLength = minLength;
    return this;
  }

  /**
   * Set the maximum length
   */
  setMaxLength(maxLength: number): this {
    if (maxLength < 1) {
      throw new BuilderValidationError(
        'maxLength',
        maxLength,
        'Maximum length must be at least 1'
      );
    }
    
    if (maxLength > COMPONENT_LIMITS.TEXT_INPUT_VALUE) {
      throw new BuilderValidationError(
        'maxLength',
        maxLength,
        `Maximum length cannot exceed ${COMPONENT_LIMITS.TEXT_INPUT_VALUE}`
      );
    }
    
    this.data.maxLength = maxLength;
    return this;
  }

  /**
   * Set the text input as required
   */
  setRequired(required: boolean = true): this {
    this.data.required = required;
    return this;
  }

  /**
   * Validate the text input data
   */
  validate(): ValidationResult {
    const errors: string[] = [];
    
    // Validate custom ID
    if (!this.data.customId) {
      errors.push('Text input must have a custom ID');
    }
    
    // Validate style
    if (!Object.values(TextInputStyle).includes(this.data.style)) {
      errors.push('Invalid text input style');
    }
    
    // Validate label
    if (!this.data.label) {
      errors.push('Text input must have a label');
    }
    
    if (this.data.label.length > COMPONENT_LIMITS.TEXT_INPUT_LABEL) {
      errors.push(`Text input label must be ${COMPONENT_LIMITS.TEXT_INPUT_LABEL} characters or less`);
    }
    
    // Validate placeholder
    if (this.data.placeholder && this.data.placeholder.length > COMPONENT_LIMITS.TEXT_INPUT_PLACEHOLDER) {
      errors.push(`Text input placeholder must be ${COMPONENT_LIMITS.TEXT_INPUT_PLACEHOLDER} characters or less`);
    }
    
    // Validate value
    if (this.data.value && this.data.value.length > COMPONENT_LIMITS.TEXT_INPUT_VALUE) {
      errors.push(`Text input value must be ${COMPONENT_LIMITS.TEXT_INPUT_VALUE} characters or less`);
    }
    
    // Validate min/max length
    if (this.data.minLength !== undefined && this.data.maxLength !== undefined) {
      if (this.data.minLength > this.data.maxLength) {
        errors.push('Minimum length cannot be greater than maximum length');
      }
    }
    
    if (this.data.maxLength !== undefined && this.data.maxLength > COMPONENT_LIMITS.TEXT_INPUT_VALUE) {
      errors.push(`Maximum length cannot exceed ${COMPONENT_LIMITS.TEXT_INPUT_VALUE}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Build the text input
   */
  build(): TextInputData {
    const validation = this.validate();
    if (!validation.valid) {
      throw new BuilderValidationError(
        'textInput',
        this.data,
        `Text input validation failed: ${validation.errors.join(', ')}`
      );
    }
    
    return { ...this.data };
  }

  /**
   * Clone the builder
   */
  clone(): TextInputBuilder {
    const cloned = new TextInputBuilder();
    cloned.data = JSON.parse(JSON.stringify(this.data));
    return cloned;
  }

  /**
   * Reset the builder
   */
  reset(): this {
    this.data = {
      type: ComponentType.TextInput,
      customId: '',
      style: TextInputStyle.Short,
      label: '',
    };
    return this;
  }

  /**
   * Convert to JSON
   */
  toJSON(): TextInputData {
    return this.build();
  }
}