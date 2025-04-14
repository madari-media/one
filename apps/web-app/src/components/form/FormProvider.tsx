import { withTheme } from '@rjsf/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

const widgets = {
  TextWidget: (props: any) => {
    const { id, required, label, value, onChange, schema } = props;
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Input
          id={id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          type={schema.type === 'number' ? 'number' : 'text'}
        />
      </div>
    );
  },
  TextareaWidget: (props: any) => {
    const { id, required, label, value, onChange } = props;
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Textarea
          id={id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  },
  CheckboxWidget: (props: any) => {
    const { id, label, value, onChange } = props;
    return (
      <div className="flex items-center space-x-2">
        <Checkbox
          id={id}
          checked={value}
          onCheckedChange={(checked) => onChange(checked)}
        />
        <Label htmlFor={id}>{label}</Label>
      </div>
    );
  },
  SelectWidget: (props: any) => {
    const { id, required, label, value, onChange, options } = props;
    const { enumOptions } = options;
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={id}>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {enumOptions?.map((option: any) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  },
  RadioWidget: (props: any) => {
    const { id, label, value, onChange, options } = props;
    const { enumOptions } = options;
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <RadioGroup value={value} onValueChange={onChange}>
          {enumOptions?.map((option: any) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem
                value={option.value}
                id={`${id}-${option.value}`}
              />
              <Label htmlFor={`${id}-${option.value}`}>{option.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  },
  SwitchWidget: (props: any) => {
    const { id, label, value, onChange } = props;
    return (
      <div className="flex items-center space-x-2">
        <Switch
          id={id}
          checked={value}
          onCheckedChange={(checked) => onChange(checked)}
        />
        <Label htmlFor={id}>{label}</Label>
      </div>
    );
  },
};

const templates = {
  ButtonTemplates: {
    SubmitButton: (props: any) => (
      <Button type="submit" {...props}>
        {props.children}
      </Button>
    ),
  },
  FieldTemplate: (props: any) => {
    const {
      id,
      classNames,
      label,
      help,
      required,
      description,
      errors,
      children,
    } = props;

    return (
      <div className={cn('space-y-2', classNames)}>
        {label && (
          <Label htmlFor={id}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {children}
        {errors}
        {help}
      </div>
    );
  },
  ObjectFieldTemplate: (props: any) => {
    const { title, description, properties } = props;
    return (
      <div className="space-y-4">
        {title && <h3 className="text-lg font-medium">{title}</h3>}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        <div className="space-y-4">
          {properties.map((prop: any) => prop.content)}
        </div>
      </div>
    );
  },
  ArrayFieldTemplate: (props: any) => {
    const { title, items, canAdd } = props;
    return (
      <div className="space-y-4">
        {title && <h3 className="text-lg font-medium">{title}</h3>}
        <div className="space-y-4">
          {items.map((item: any) => (
            <div key={item.key} className="flex items-start space-x-4">
              <div className="flex-1">{item.children}</div>
              {item.hasRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={item.onDropIndexClick(item.index)}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
        {canAdd && (
          <Button variant="outline" onClick={props.onAddClick}>
            Add Item
          </Button>
        )}
      </div>
    );
  },
};

export const FormProvider = withTheme({ widgets, templates });