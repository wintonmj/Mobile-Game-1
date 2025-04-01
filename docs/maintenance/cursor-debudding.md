This doc will outline the strategy for using cursor to debug an error 

1. check if this error exists in our /maintainance-errors folder. 
2. If yes
    - check the file related to that error for previously attempted solutions 
    - propose 3 untried new solutions, give reasons for how they address what previous solutions did not
    - propose the number 1 option that you would reccommend out of the 3
    - implement it

3. If no
    - create a new error doc
        - list which feature/component(s) is/are effected by this error
        - list relevant documentation for the tools that are utilised by this error
        - what that component's purpose is in the architecture 
        - Possible causes for this error
        - list of solutions
            - propose 3 untried new solutions, give reasons for how they address this error
                - what patterns it uses
            - propose the number 1 option that you would reccommend out of the 3
            - implement it
                If it fix the error 
                    - note it as a viable solution
                        - How it worked
                        - why it worked 
                If it mark it as a failed solution
                    - note it as a failed solution
                        - What new or existing error it threw afterwards
                        - Explain what that means in relation to this solution
                        - Add context to the description of this error for what is the probably causes for this error base off of what this failing solution taught us. 
                    

