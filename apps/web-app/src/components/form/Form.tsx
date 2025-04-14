import { Fragment } from 'react/jsx-runtime';
import { FormProvider } from './FormProvider';
import { cn } from '@/lib/utils';

interface FormProps {
  schema: any;
  formData?: any;
  onChange?: (data: any) => void;
  className?: string;
  uiSchema?: any;
  validator?: any;
}

export const Form = ({
  schema,
  formData,
  onChange,
  className,
  uiSchema,
  validator,
}: FormProps) => {
  const ThemedForm = FormProvider;

  return (
    <div className={cn('w-full', className)}>
      <ThemedForm
        schema={schema}
        formData={formData}
        onChange={onChange}
        uiSchema={uiSchema}
        validator={validator}
        showErrorList={false}
      >
        <Fragment></Fragment>
      </ThemedForm>
    </div>
  );
};