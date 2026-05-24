pipeline {

    agent any

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        IMAGE_NAME = "amalantonypulikkottil/enterprise-node-app"
        CONTAINER_NAME = "enterprise-container"
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
                    sh 'npm install'
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
                docker build -t $IMAGE_NAME ./app
                '''
            }
        }

        stage('Trivy Security Scan') {
            steps {
                sh '''
                trivy image --severity HIGH,CRITICAL $IMAGE_NAME
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
                docker push $IMAGE_NAME
                '''
            }
        }

        stage('Stop Old Container') {
            steps {
                sh '''
                docker stop $CONTAINER_NAME || true
                docker rm $CONTAINER_NAME || true
                '''
            }
        }

        stage('Deploy New Container') {
            steps {
                sh '''
                docker run -d \
                --name $CONTAINER_NAME \
                -p 3000:3000 \
                $IMAGE_NAME
                '''
            }
        }

        stage('Application Health Check') {
            steps {
                sh '''
                sleep 10
                curl -f http://localhost:3000 || exit 1
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
            echo 'Enterprise DevSecOps Pipeline SUCCESS'
            echo 'Application deployed successfully'
            echo '========================================='
        }

        failure {
            echo '========================================='
            echo 'Enterprise DevSecOps Pipeline FAILED'
            echo 'Check Jenkins logs immediately'
            echo '========================================='
        }

        always {
            sh 'docker ps -a'
        }
    }
}
