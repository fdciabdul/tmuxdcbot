pkg install openssl-tool
current_date=$(date)
echo "Today is $current_date \n"
echo -e "\e[32m You need heroku account , if don't have it , please create new account in heroku.com"

echo    # (optional) move to a new line
    read -p "Do you want to create heroku account [y/n]" yn
    case $yn in
        [Yy]* ) am start --user 0 -a android.intent.action.VIEW -d "https://heroku.com" > /dev/null ; break;;
        [Nn]* ) heroku login -i ;;
        * ) echo "Please answer yes or no.";;
    esac

echo -e " Creating new apps , save your apps name "
heroku create
