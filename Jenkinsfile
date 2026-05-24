pipeline {

    agent any

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {

        IMAGE_NAME = "amalantonypulikkottil/enterprise-node-app"

        KUBERNETES_DEPLOYMENT = "enterprise-node-app"

        KUBERNETES_SERVICE = "enterprise-node-service"
    }

    stages {

        stage('Checkout Code') {
            steps {

                git(
                    branch: 'main',
                    url: 'git@github.com:amalantonypulikkottil/enterprise-devsecops-platform.git',
                    credentialsId: 'github-ssh'
                )

            }
        }

        stage('Install Dependencies') {
            steps {

                dir('app') {

                    sh '''
                    npm install
                    '''

                }

            }
        }

        stage('SonarQube Scan') {
            steps {

                withCredentials([string(
                    credentialsId: 'sonar-token',
                    variable: 'SONAR_TOKEN'
                )]) {

                    withSonarQubeEnv('sonarqube') {

                        sh '''
                        sonar-scanner \
                        -Dsonar.projectKey=enterprise-devsecops \
                        -Dsonar.sources=app \
                        -Dsonar.host.url=http://40.192.39.77:9000 \
                        -Dsonar.login=$SONAR_TOKEN
                        '''

                    }
                }

            }
        }

        stage('Build Docker Image') {
            steps {

                sh '''
                docker build -t $IMAGE_NAME:latest ./app
                '''

            }
        }

        stage('Trivy Security Scan') {
            steps {

                sh '''
                trivy image --severity HIGH,CRITICAL $IMAGE_NAME:latest
                '''

            }
        }

        stage('DockerHub Login') {
            steps {

                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {

                    sh '''
                    echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                    '''

                }

            }
        }

        stage('Push Docker Image') {
            steps {

                sh '''
                docker push $IMAGE_NAME:latest
                '''

            }
        }

        stage('Deploy to Kubernetes') {
            steps {

                sh '''
                kubectl apply -f k8s/
                '''

            }
        }

        stage('Restart Kubernetes Deployment') {
            steps {

                sh '''
                kubectl rollout restart deployment $KUBERNETES_DEPLOYMENT
                '''

            }
        }

        stage('Wait For Kubernetes Deployment') {
            steps {

                sh '''
                kubectl rollout status deployment $KUBERNETES_DEPLOYMENT --timeout=120s
                '''

            }
        }

        stage('Verify Kubernetes Resources') {
            steps {

                sh '''
                echo "========== PODS =========="
                kubectl get pods -o wide

                echo "========== SERVICES =========="
                kubectl get svc

                echo "========== DEPLOYMENTS =========="
                kubectl get deployments
                '''

            }
        }

        stage('Application Health Check') {
            steps {

                sh '''
                kubectl get pods
                '''

            }
        }

        stage('Cleanup Old Docker Images') {
            steps {

                sh '''
                docker image prune -af
                '''

            }
        }

    }

    post {

        success {

            echo '========================================='
            echo 'Enterprise Kubernetes DevSecOps SUCCESS'
            echo 'Application deployed to Kubernetes'
            echo '========================================='

        }

        failure {

            echo '========================================='
            echo 'Enterprise Kubernetes DevSecOps FAILED'
            echo 'Check Jenkins logs immediately'
            echo '========================================='

        }

        always {

            sh '''
            echo "========== FINAL POD STATUS =========="
            kubectl get pods -o wide

            echo "========== FINAL SERVICE STATUS =========="
            kubectl get svc
            '''

        }
    }
}
