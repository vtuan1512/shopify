import {
  Page,
  Layout,
  LegacyCard,
  TextField,
  DropZone,
  Badge,
  Toast,
  Frame,
  Text,
} from '@shopify/polaris';
import React, { useState, useEffect, Suspense } from 'react';
import { useNavigate, useFetcher } from '@remix-run/react';
import 'react-quill/dist/quill.snow.css';
const ReactQuill = React.lazy(() => import('react-quill'));

export default function NewProduct() {
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [files, setFiles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toastActive, setToastActive] = useState(false);
  const [toastContent, setToastContent] = useState('');

  const handleDropZoneDrop = (_dropFiles, acceptedFiles, _rejectedFiles) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file)
    }));
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  const removeFile = () => {
    setFiles([]);
  };
  const handleSubmit = async () => {
    setIsSaving(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('price', price);

    files.forEach(({ file }) => formData.append('images', file));

    fetcher.submit(formData, { method: 'POST', action: '/app/products/create' });
  };

  useEffect(() => {
    if (fetcher.state === 'idle') {
      if (fetcher.data?.success) {
        setToastContent(fetcher.data.success);
        setToastActive(true);
        navigate('/app/products');
      } else if (fetcher.data?.errors) {
        console.error(fetcher.data.errors);
        setToastContent('Failed to add the product.');
        setToastActive(true);
      }
      setIsSaving(false);
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <Frame>
      <Page
        title="Add Product"
        titleMetadata={<Badge status="new">New</Badge>}
        primaryAction={{ content: 'Save', onAction: handleSubmit, loading: isSaving }}
        backAction={{ content: 'Products', onAction: () => navigate('/app/products') }}
      >
        <Layout>
          <Layout.Section>
            <LegacyCard sectioned title="Product Details">
              <TextField
                label="Title"
                value={title}
                onChange={setTitle}
                autoComplete="off"
                placeholder="Enter the product title"
              />

              <Text as="p" variant="bodyMd">
                Description
              </Text>
              <div style={{ marginTop: '10px' }}>
                <Suspense >
                  <ReactQuill
                    theme="snow"
                    value={description}
                    onChange={setDescription}
                    style={{
                      height: '350px',
                      overflowY: 'auto',
                      maxHeight: '400px'
                    }}
                    modules={{
                      toolbar: [
                        [{ header: '1' }, { header: '2' }, { font: [] }],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['bold', 'italic', 'underline'],
                        ['image', 'code-block'],
                        [{ 'align': [] }],
                        [{ 'color': [] }, { 'background': [] }],
                        ['clean'],
                      ],
                    }}
                  />
                </Suspense>
              </div>

              <TextField
                label="Price"
                value={price}
                onChange={setPrice}
                autoComplete="off"
                type="number"
                placeholder="Enter the product price"
              />
            </LegacyCard>

            <LegacyCard sectioned title="Images" actions={[{ content: 'Remove All', onAction: removeFile }]}>
              <DropZone onDrop={handleDropZoneDrop}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {files.length > 0 ? (
                    files.map((fileWrapper, index) => (
                      <div
                        key={index}
                        style={{
                          position: 'relative',
                          width: '150px',
                          height: '150px',
                          borderRadius: '5px',
                          overflow: 'hidden',
                          boxShadow: '0 0 5px rgba(0,0,0,0.2)'
                        }}
                      >
                        <img
                          src={fileWrapper.url}
                          alt={fileWrapper.file.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ))
                  ) : (
                    <DropZone.FileUpload />
                  )}
                </div>
              </DropZone>
            </LegacyCard>
          </Layout.Section>
        </Layout>

        {toastActive && <Toast content={toastContent} onDismiss={() => setToastActive(false)} />}
      </Page>
    </Frame>
  );
}
