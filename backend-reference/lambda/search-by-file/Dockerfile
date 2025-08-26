# Use AWS Lambda Python runtime as base
FROM public.ecr.aws/lambda/python:3.11

# Install system dependencies for OpenCV
RUN yum update -y && \
    yum install -y \
    opencv \
    mesa-libGL \
    ffmpeg \
    && yum clean all

RUN pip install --no-cache-dir \
    torch torchvision \
    --index-url https://download.pytorch.org/whl/cpu

# Copy requirements and install Python dependencies
COPY requirements.txt ${LAMBDA_TASK_ROOT}
RUN pip install --no-cache-dir -r requirements.txt

COPY model.pt ${LAMBDA_TASK_ROOT}
COPY birdnet_analyzer ${LAMBDA_TASK_ROOT}/birdnet_analyzer

# Copy function code
COPY yolo_detector.py ${LAMBDA_TASK_ROOT}
COPY run_birdnet.py ${LAMBDA_TASK_ROOT}
COPY lambda_handler.py ${LAMBDA_TASK_ROOT}

# Command to run the lambda function
CMD ["lambda_handler.lambda_handler"] 