import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExtensionDef, useExtension } from '@/hooks/useExtension';
import { Extension, useExtensionContext } from '@/context/ExtensionContext';
import Editor from '@monaco-editor/react';
import json5 from 'json5';
import {
  Code2,
  Download,
  FileCode2,
  Loader2,
  Play,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { Form } from '@/components/form/Form';
import validator from '@rjsf/validator-ajv8';

interface ExtensionWithName extends Extension {
  name: string;
}

const DEFAULT_CONFIG = `{}`;
const DEFAULT_META = `{}`;

export const ExtensionSettings: React.FC = () => {
  const {
    extensions,
    addExtension,
    updateExtension,
    addExtensionConfig,
    updateExtensionConfig,
    removeExtensionConfig,
    removeExtension,
  } = useExtensionContext();

  const [newExtension, setNewExtension] = useState<Partial<ExtensionWithName>>(
    {},
  );
  const [selectedExtension, setSelectedExtension] =
    useState<ExtensionWithName | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedConfigIndex, setSelectedConfigIndex] = useState<number | null>(
    null,
  );
  const [newConfig, setNewConfig] = useState<Record<string, any> | null>(null);
  const [configSchema, setConfigSchema] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [debugOutput, setDebugOutput] = useState<string>('');
  const [isDebugging, setIsDebugging] = useState(false);
  const [urlToLoad, setUrlToLoad] = useState('');
  const [isDebugDialogOpen, setIsDebugDialogOpen] = useState(false);
  const [testConfig, setTestConfig] = useState<string>(DEFAULT_CONFIG);
  const [testMeta, setTestMeta] = useState<string>(DEFAULT_META);
  const [activeTab, setActiveTab] = useState('script');
  const [debugExtensions, setDebugExtensions] = useState<ExtensionDef[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingExtension, setEditingExtension] =
    useState<ExtensionWithName | null>(null);
  const [editedScript, setEditedScript] = useState<string>('');

  const { callGetStreams: debugCallGetStreams, callGetConfigSchema } =
    useExtension(debugExtensions, {
      onDebug: (data) => {
        setDebugOutput((prev) => prev + '\n' + JSON.stringify(data, null, 2));
      },
    });

  useEffect(() => {
    const loadConfigSchema = async () => {
      if (selectedExtension) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 100));
          const schema = await callGetConfigSchema(selectedExtension.id);
          setConfigSchema(schema);
        } catch (error) {
          console.error('Failed to load config schema:', error);
          setConfigSchema(null);
        }
      }
    };

    loadConfigSchema();
  }, [selectedExtension, callGetConfigSchema]);

  const handleAddExtension = () => {
    if (newExtension.id && newExtension.script) {
      addExtension({
        id: newExtension.id,
        script: newExtension.script,
        configs: [],
      });
      setNewExtension({});
    }
  };

  const handleAddConfig = () => {
    if (selectedExtension) {
      addExtensionConfig(selectedExtension.id, newConfig);
      setNewConfig(null);
      setSelectedConfigIndex(null);
      setIsConfigDialogOpen(false);
    }
  };

  const handleConfigSubmit = () => {
    if (selectedExtension) {
      if (selectedConfigIndex === null) {
        handleAddConfig();
      } else {
        updateExtensionConfig(
          selectedExtension.id,
          selectedConfigIndex,
          newConfig,
        );
        setNewConfig(null);
        setSelectedConfigIndex(null);
        setIsConfigDialogOpen(false);
      }
    }
  };

  const handleRemoveConfig = (index: number) => {
    if (selectedExtension) {
      removeExtensionConfig(selectedExtension.id, index);
      if (selectedConfigIndex === index) {
        setSelectedConfigIndex(null);
        setNewConfig(null);
        setTestConfig(DEFAULT_CONFIG);
      }
    }
  };

  const handleRemoveExtension = (id: string) => {
    removeExtension(id);
  };

  const handleToggleExtension = (id: string, enabled: boolean) => {
    updateExtension(id, { enabled });
  };

  const handleEditConfig = (index: number) => {
    if (selectedExtension) {
      setSelectedConfigIndex(index);
      setNewConfig(selectedExtension.configs[index]);
      setTestConfig(JSON.stringify(selectedExtension.configs[index], null, 2));
    }
  };

  const handleConfigChange = (data: any) => {
    if (data.formData) {
      setNewConfig(data.formData);
      setTestConfig(JSON.stringify(data.formData, null, 2));
    }
  };

  const handleLoadFromUrl = async () => {
    if (!urlToLoad) return;

    try {
      const response = await fetch(urlToLoad);
      const script = await response.text();
      setNewExtension((prev) => ({ ...prev, script }));
      setIsUrlDialogOpen(false);
    } catch (error) {
      console.error('Failed to load script from URL:', error);
    }
  };

  const handleDebug = async (extension: ExtensionWithName) => {
    setSelectedExtension(extension);
    setDebugExtensions([{ id: extension.id, script: extension.script }]);
    setDebugOutput('');
    setIsDebugDialogOpen(true);
    setConfigSchema(null);
    setSelectedConfigIndex(null);
    setNewConfig({});
    setTestConfig(DEFAULT_CONFIG);
  };

  const runDebug = async () => {
    if (!selectedExtension) return;

    setIsDebugging(true);
    setDebugOutput('');
    try {
      const config = json5.parse(testConfig);
      const meta = json5.parse(testMeta);

      const result = await debugCallGetStreams(
        selectedExtension.id,
        config,
        meta,
        undefined,
        {
          debug: true,
        },
      );
      setDebugOutput((prev) => prev + '\n' + JSON.stringify(result, null, 2));
    } catch (error: unknown) {
      console.error('Debug error:', error);
      setDebugOutput(
        (prev) =>
          prev +
          '\n' +
          JSON.stringify(
            { error: error instanceof Error ? error.message : String(error) },
            null,
            2,
          ),
      );
    } finally {
      setIsDebugging(false);
    }
  };

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setEditedScript(value);
    }
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingExtension && editedScript) {
      updateExtension(editingExtension.id, { script: editedScript });
      setIsEditing(false);
      setEditingExtension(null);
      setEditedScript('');
    }
  }, [editingExtension, editedScript, updateExtension]);

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FileCode2 className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Extensions Yet</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        Extensions allow you to customize and extend the functionality of your
        application. Add your first extension to get started.
      </p>
      <Button onClick={() => setIsAdding(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Add Extension
      </Button>
    </div>
  );

  if (isAdding) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-xl font-semibold">Add New Extension</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsUrlDialogOpen(true)}>
              <Download className="w-4 h-4 mr-2" />
              Load from URL
            </Button>
            <Button variant="ghost" onClick={() => setIsAdding(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 flex flex-col p-4">
          <div className="mb-4">
            <Input
              placeholder="ID"
              value={newExtension.id || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewExtension({ ...newExtension, id: e.target.value })
              }
              className="w-64"
            />
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              defaultLanguage="typescript"
              value={newExtension.script || ''}
              onChange={(value: string | undefined) =>
                setNewExtension({ ...newExtension, script: value || '' })
              }
              theme="vs-dark"
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                readOnly: false,
                automaticLayout: true,
              }}
            />
          </div>
          <div className="flex justify-between mt-4">
            <Button
              onClick={() => {
                if (newExtension.script) {
                  handleDebug({
                    ...newExtension,
                    id: '',
                    enabled: true,
                  } as ExtensionWithName);
                }
              }}
              disabled={isDebugging || !newExtension.script}
            >
              {isDebugging ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Debug
            </Button>
            <Button
              onClick={handleAddExtension}
              disabled={!newExtension.id || !newExtension.script}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Extension
            </Button>
          </div>
        </div>

        {isUrlDialogOpen && (
          <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Load from URL</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="URL"
                  value={urlToLoad}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUrlToLoad(e.target.value)
                  }
                />
                <Button onClick={handleLoadFromUrl} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Load
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Extensions</h2>
          <p className="text-sm text-muted-foreground">
            Manage and debug your custom extensions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Extension
          </Button>
        </div>
      </div>

      {extensions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {extensions.map((extension) => (
            <Card key={extension.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={extension.enabled}
                      onCheckedChange={(enabled) =>
                        handleToggleExtension(extension.id, enabled)
                      }
                    />
                    <span className="font-medium">{extension.id}</span>
                  </div>
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingExtension({
                        ...extension,
                        name: extension.id,
                      } as ExtensionWithName);
                      setEditedScript(extension.script);
                      setIsEditing(true);
                    }}
                  >
                    <FileCode2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleDebug({
                        ...extension,
                        name: extension.id,
                      } as ExtensionWithName)
                    }
                  >
                    <Code2 className="w-4 h-4 mr-2" />
                    Debug
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveExtension(extension.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing && editingExtension?.id === extension.id ? (
                  <div className="space-y-4">
                    <div className="h-96 border border-border rounded-lg overflow-hidden">
                      <Editor
                        height="100%"
                        defaultLanguage="typescript"
                        value={editedScript}
                        onChange={(value: string | undefined) =>
                          handleEditorChange(value)
                        }
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: true },
                          fontSize: 14,
                          lineNumbers: 'on',
                          roundedSelection: false,
                          scrollBeyondLastLine: false,
                          readOnly: false,
                          automaticLayout: true,
                        }}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setEditingExtension(null);
                          setEditedScript('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSaveEdit}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium">Configurations</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedExtension({
                            ...extension,
                            name: extension.id,
                          } as ExtensionWithName);
                          setSelectedConfigIndex(null);
                          setNewConfig({});
                          setIsConfigDialogOpen(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Config
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {extension.configs?.map((config, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50"
                        >
                          <span className="text-sm">Config {index + 1}</span>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedExtension({
                                  ...extension,
                                  name: extension.id,
                                } as ExtensionWithName);
                                setSelectedConfigIndex(index);
                                setNewConfig(config);
                                setIsConfigDialogOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveConfig(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                      {(!extension.configs ||
                        extension.configs.length === 0) && (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No configurations added yet
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedConfigIndex === null
                ? 'Add Configuration'
                : 'Edit Configuration'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {configSchema ? (
              <Form
                schema={configSchema}
                formData={newConfig}
                onChange={handleConfigChange}
                validator={validator}
              />
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                Loading configuration schema...
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsConfigDialogOpen(false);
                  setNewConfig({});
                  setSelectedConfigIndex(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleConfigSubmit}>
                {selectedConfigIndex === null ? 'Add' : 'Update'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDebugDialogOpen} onOpenChange={setIsDebugDialogOpen}>
        <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code2 className="w-5 h-5" />
              Config for {selectedExtension?.name || 'New Extension'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col"
            >
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="script">Script</TabsTrigger>
                <TabsTrigger value="config">Config</TabsTrigger>
                <TabsTrigger value="meta">Meta</TabsTrigger>
                <TabsTrigger value="output">Output</TabsTrigger>
              </TabsList>
              <TabsContent value="script" className="flex-1 min-h-0">
                <div className="h-full border rounded-lg overflow-hidden">
                  <Editor
                    height="100%"
                    defaultLanguage="typescript"
                    value={selectedExtension?.script || ''}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: true },
                      fontSize: 14,
                      lineNumbers: 'on',
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      readOnly: true,
                      automaticLayout: true,
                    }}
                  />
                </div>
              </TabsContent>
              <TabsContent value="config" className="flex-1 min-h-0">
                <div className="h-full flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Configurations</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedConfigIndex(null);
                        setNewConfig({});
                        setTestConfig(DEFAULT_CONFIG);
                      }}
                    >
                      Add New Config
                    </Button>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="border rounded-lg overflow-hidden">
                      <div className="p-4 border-b">
                        <h4 className="font-medium">
                          Available Configurations
                        </h4>
                      </div>
                      <ScrollArea className="h-[calc(100%-4rem)]">
                        <div className="p-4 space-y-2">
                          {selectedExtension?.configs?.map((_, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50"
                            >
                              <span className="text-sm">
                                Config {index + 1}
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditConfig(index)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveConfig(index)}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="p-4 border-b">
                        <h4 className="font-medium">
                          {selectedConfigIndex === null
                            ? 'New Configuration'
                            : 'Edit Configuration'}
                        </h4>
                      </div>
                      <div className="p-4">
                        {configSchema ? (
                          <Form
                            schema={configSchema}
                            formData={newConfig}
                            onChange={handleConfigChange}
                            validator={validator}
                          />
                        ) : (
                          <div className="p-4 text-center text-muted-foreground">
                            Loading configuration schema...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="meta" className="flex-1 min-h-0">
                <div className="h-full border rounded-lg overflow-hidden">
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    value={testMeta}
                    onChange={(value: string | undefined) =>
                      setTestMeta(value || '')
                    }
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: true },
                      fontSize: 14,
                      lineNumbers: 'on',
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      readOnly: false,
                      automaticLayout: true,
                    }}
                  />
                </div>
              </TabsContent>
              <TabsContent value="output" className="flex-1 min-h-0">
                <div className="h-full border rounded-lg overflow-hidden">
                  <ScrollArea className="h-full">
                    <pre className="p-4 text-sm font-mono whitespace-pre-wrap bg-muted/50">
                      {debugOutput ||
                        'No output yet. Click "Run Debug" to test the extension.'}
                    </pre>
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {isDebugging ? 'Running debug...' : 'Ready to debug'}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTestConfig(DEFAULT_CONFIG);
                    setTestMeta(DEFAULT_META);
                  }}
                >
                  Reset
                </Button>
                <Button onClick={runDebug} disabled={isDebugging}>
                  {isDebugging ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Run Debug
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
