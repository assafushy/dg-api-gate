#!/bin/bash
sleep 20
# add minio server
./mc alias set doc-gen-minio/ $MINIOSERVER $MINIOROOTUSER $MINIOROOTPASSWORD

# check and  setup bucket templates
./mc mb doc-gen-minio/templates
./mc policy set public doc-gen-minio/templates
# load templates
./mc cp ./assets/templates/* doc-gen-minio/templates

# check and  setup bucket document-forms
./mc mb doc-gen-minio/document-forms
./mc policy set public doc-gen-minio/document-forms

#load form-templates
./mc cp ./assets/document-forms/* doc-gen-minio/document-forms
