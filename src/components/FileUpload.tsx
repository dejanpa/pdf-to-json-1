'use client';

import { useState, useMemo, useEffect } from 'react';
import DropZone from './Dropzone';
import clsx from 'clsx';
import RawJsonDisplay from './RawJsonDisplay';
import Image from 'next/image';
import Spinner from './Spinner';
import styles from './SchemaPropertyInput.module.css';
import {
  restaurant_schema_with_menu,
  restaurant_schema_without_menu,
  real_estate_brochure_schema,
  invoice_schema,
  my_custom_template,
} from '../data/sampleSchemas';

import { AiOutlinePlus, AiOutlineClose } from 'react-icons/ai';

import { Schema } from '@Types/schemaTypes';
import SchemaPropertyInput, {
  StatefulSchemaPropertyWithTitle,
} from './SchemaPropertyInput';
import SchemaContext from '@Context/schema-context';
import JSONIFYIllustration from '@Assets/jsonify-illustration.png';

export default function FileUploadForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDropActive, setIsDropActive] = useState(false);
  const [schemaExampleSelect, setExampleSelect] = useState('custom');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rawJson, setRawJson] = useState<any[]>([]);
  const [templateName, setTemplateName] = useState(''); // New state for template name
  const [schemaProperties, setSchemaProperties] = useState<
    StatefulSchemaPropertyWithTitle[]
  >([
    {
      title: '',
      description: '',
      type: 'string',
      example: '',
    },
  ]);
  const [availableTemplates, setAvailableTemplates] = useState<
    Record<string, StatefulSchemaPropertyWithTitle[]>
  >({
    myCustomTemplate: my_custom_template,
    invoiceExample: invoice_schema,
    menuExample: restaurant_schema_without_menu,
    menuExampleWithItems: restaurant_schema_with_menu,
    realEstateExample: real_estate_brochure_schema,
  });

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/get-templates');
        const templates = await response.json();
        setAvailableTemplates(templates);
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };

    fetchTemplates();
  }, []);

  const memoizedSchemaContext = useMemo(
    () => ({
      schemaProperties,
      handleAddSchemaProperty: (parentIndex?: number) => {
        if (parentIndex !== undefined) {
          const parentProperty = schemaProperties[parentIndex];
          const updatedSubProperties = parentProperty.items || [];
          updatedSubProperties.push({
            title: '',
            description: '',
            type: 'string',
            example: '',
          });

          parentProperty.items = updatedSubProperties;

          const updatedSchemaProperties = [...schemaProperties];
          updatedSchemaProperties[parentIndex] = parentProperty;
          setSchemaProperties(updatedSchemaProperties);
        } else {
          if (schemaProperties.length < 10) {
            setSchemaProperties([
              ...schemaProperties,
              {
                title: '',
                description: '',
                type: 'string',
                example: '',
              },
            ]);
          }
        }
      },
      handleRemoveSchemaProperty: (index: number, parentIndex?: number) => {
        if (parentIndex !== undefined) {
          const parentProperty = schemaProperties[parentIndex];
          const updatedSubProperties = parentProperty.items || [];
          updatedSubProperties.splice(index, 1);

          parentProperty.items = updatedSubProperties;

          const updatedSchemaProperties = [...schemaProperties];
          updatedSchemaProperties[parentIndex] = parentProperty;
          setSchemaProperties(updatedSchemaProperties);
        } else {
          const updatedSchemaProperties = [...schemaProperties];
          updatedSchemaProperties.splice(index, 1);
          setSchemaProperties(updatedSchemaProperties);
        }
      },
      handleSchemaPropertyChange: (
        index: number,
        property: StatefulSchemaPropertyWithTitle,
        parentIndex?: number,
      ) => {
        if (parentIndex !== undefined) {
          const parentProperty = schemaProperties[parentIndex];
          const updatedSubProperties = parentProperty.items || [];
          updatedSubProperties[index] = property;

          parentProperty.items = updatedSubProperties;

          const updatedSchemaProperties = [...schemaProperties];
          updatedSchemaProperties[parentIndex] = parentProperty;
          setSchemaProperties(updatedSchemaProperties);
        } else {
          const updatedSchemaProperties = [...schemaProperties];
          updatedSchemaProperties[index] = property;
          setSchemaProperties(updatedSchemaProperties);
        }
      },
    }),
    [schemaProperties],
  );

  const handleSchemaExampleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTemplate = availableTemplates[event.target.value];
    setExampleSelect(event.target.value);

    if (selectedTemplate) {
      setSchemaProperties(selectedTemplate);
    } else {
      setSchemaProperties([
        {
          title: '',
          description: '',
          type: 'string',
          example: '',
        },
      ]);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a name for the template.');
      return;
    }

    try {
      const response = await fetch('/api/save-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: templateName.trim(),
          schema: schemaProperties,
        }),
      });

      if (response.ok) {
        alert('Template saved successfully!');

        const updatedTemplatesResponse = await fetch('/api/get-templates');
        const updatedTemplates = await updatedTemplatesResponse.json();
        setAvailableTemplates(updatedTemplates);
        setTemplateName(''); // Clear the input field after saving
      } else {
        const error = await response.json();
        alert(`Error saving template: ${error.message}`);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template. Please try again.');
    }
  };

  const handleSaveJson = async () => {
    try {
      const response = await fetch('/api/save-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: rawJson }),
      });

      if (response.ok) {
        alert('JSON file saved successfully!');
      } else {
        const error = await response.json();
        alert(`Error saving JSON: ${error.message}`);
      }
    } catch (error) {
      console.error('Error saving JSON:', error);
      alert('Failed to save JSON. Please try again.');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!files.length) {
      alert('Please upload at least one PDF file.');
      return;
    }

    const schema: Schema = schemaProperties.reduce((acc, property) => {
      if (property.items !== undefined) {
        return {
          ...acc,
          [property.title]: {
            description: property.description,
            type: property.type,
            items: property.items.reduce(
              (xcc, item) => ({
                ...xcc,
                [item.title]: {
                  description: item.description,
                  type: item.type,
                  example: item.example,
                },
              }),
              {},
            ),
          },
        };
      } else {
        return {
          ...acc,
          [property.title]: {
            description: property.description,
            type: property.type,
            example: property.example,
          },
        };
      }
    }, {});

    setRawJson([]);
    setIsLoading(true);
    setErrorMessage('');

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('schema', JSON.stringify(schema));

        const response = await fetch('/api/upload-pdf', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorResponse = await response.json();
          throw new Error(errorResponse.error);
        }

        const { data } = await response.json();

        if (data) {
          setRawJson((prevRawJson) => (prevRawJson ? [...prevRawJson, data] : [data]));
        }
      }
    } catch (error: any) {
      setErrorMessage(`${error.message}`);
    }

    setIsLoading(false);
  };

  return (
    <SchemaContext.Provider value={memoizedSchemaContext}>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-start">
        <div className="w-full p-1 lg:w-3/5">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="mb-4 text-lg font-semibold">Define Your Data</h2>
            <div>
              <label htmlFor="templateName" className={styles.formControlLabel}>
                Enter a name for your template:
              </label>
              <input
                type="text"
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className={clsx(styles.formControl, 'mb-5 !w-1/2')}
                placeholder="Template name"
              />
              <label htmlFor="schemaOptions" className={styles.formControlLabel}>
                Select a predefined schema from the dropdown or build your own.
              </label>
              <select
                value={schemaExampleSelect}
                onChange={handleSchemaExampleChange}
                name="schemaOptions"
                id="schemaOptions"
                className={clsx(styles.formControl, 'mb-5 !w-1/2')}
              >
                <option value="custom">Custom</option>
                {Object.keys(availableTemplates).map((templateName) => (
                  <option key={templateName} value={templateName}>
                    {templateName.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-left">
              {schemaProperties.map((property, index) => (
                <div className="relative" key={index}>
                  <SchemaPropertyInput
                    index={index}
                    property={property}
                    className="p-3 pb-4 mb-2 bg-gray-100 rounded-lg"
                  />
                  {schemaProperties.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        memoizedSchemaContext.handleRemoveSchemaProperty(index)
                      }
                      className="absolute top-0 right-0 p-1 text-red-500 hover:text-red-700"
                    >
                      <AiOutlineClose size={24} />
                    </button>
                  )}
                </div>
              ))}
              {schemaProperties.length < 10 && (
                <button
                  type="button"
                  className="flex items-center px-4 py-2 mt-2 font-bold text-white bg-green-500 rounded hover:bg-green-700 focus:ring-2 focus:ring-green-400"
                  onClick={() => memoizedSchemaContext.handleAddSchemaProperty()}
                >
                  <AiOutlinePlus size={24} className="mx-2" /> Add Field
                </button>
              )}
            </div>
            <button
              type="button"
              className="w-full px-4 py-2 mt-4 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-400"
              onClick={handleSaveTemplate}
            >
              Save Template
            </button>
          </div>
        </div>
        <div className="w-full p-1 lg:w-2/5">
          <div className="p-6 mb-4 bg-white rounded-lg shadow-md lg:mb-0">
            <h2 className="mb-4 text-lg font-semibold">Upload Your PDF</h2>
            <DropZone
              onDragStateChange={setIsDropActive}
              onFilesDrop={setFiles}
              className={clsx(
                'relative w-full h-32',
                'border-2 border-dashed rounded-xl',
                isDropActive
                  ? 'bg-blue-200 border-blue-500'
                  : 'bg-gray-100 border-gray-300',
              )}
            >
              <input
                type="file"
                id="fileUpload"
                className="absolute top-0 left-0 invisible w-full h-full"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                accept="application/pdf"
                multiple
              />
              <label
                htmlFor="fileUpload"
                className="flex items-center justify-center w-full h-full p-4 mb-2 font-semibold text-center text-gray-700 cursor-pointer"
              >
                {files.length ? (
                  <div>
                    {files.length} file&#40;s&#41; selected
                    <br />
                    <span className="text-blue-500 hover:text-blue-700">
                      Change PDF&#40;s&#41;
                    </span>
                  </div>
                ) : (
                  <div>
                    Drag and drop PDFs here, or
                    <br />
                    <span className="text-blue-500 hover:text-blue-700">
                      browse your device
                    </span>
                    .
                  </div>
                )}
              </label>
            </DropZone>
          </div>
          <div className="p-6 mt-2 bg-white rounded-lg shadow-md">
            <h2 className="mb-4 text-lg font-semibold">Generate Data</h2>
            <button
              type="submit"
              className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-400"
            >
              {isLoading ? <Spinner /> : 'Generate Data'}
            </button>
            {rawJson.length > 0 && (
              <>
                <div className="mt-4">
                  <RawJsonDisplay data={rawJson} />
                </div>
                <button
                  type="button"
                  className="w-full px-4 py-2 mt-2 font-bold text-white bg-green-500 rounded hover:bg-green-700 focus:ring-2 focus:ring-green-400"
                  onClick={handleSaveJson}
                >
                  Save JSON
                </button>
              </>
            )}
            <div className="mt-4 text-red-600">
              {errorMessage && <p>{errorMessage}</p>}
            </div>
          </div>
        </div>
      </form>
    </SchemaContext.Provider>
  );
}
