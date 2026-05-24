pipeline {

    agent any

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {

        IMAGE_NAME = "amalantonypulikkottil/enterprise-node-app"

    }

    stages {

        stage('Checkout Application Code') {
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

        stage('Update GitOps Repository') {
            steps {

                dir('gitops') {

                    git(
                        branch: 'main',
                        url: 'git@github.com:amalantonypulikkottil/enterprise-k8s-manifests.git',
                        credentialsId: 'github-ssh'
                    )

                    sh '''
                    sed -i 's|image:.*|image: amalantonypulikkottil/enterprise-node-app:latest|g' deployment.yaml

                    git config user.email "jenkins@devops.com"
                    git config user.name "Jenkins"

                    git add .
                    git commit -m "Updated image version"

                    git push origin main
                    '''

                }

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
            echo 'Enterprise GitOps DevSecOps SUCCESS'
            echo 'ArgoCD will deploy automatically'
            echo '========================================='

        }

        failure {

            echo '========================================='
            echo 'Enterprise GitOps DevSecOps FAILED'
            echo 'Check Jenkins logs immediately'
            echo '========================================='

        }

        always {

            sh '''
            docker images
            '''

        }
    }
}
