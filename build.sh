# 1. clean build
rm -rf ./build

# 2. tsc compile 
./node_modules/.bin/ttsc -p tsconfig.json

# 3. copy custom dts files
cp -r ./src/common/types ./build/common
